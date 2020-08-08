# patreon-rss-poc

A proof-of-concept to be notified via RSS when one of your pledged creators on Patreon makes a new public/exclusive post.

This is only a proof-of-concept because I haven't found a way to reliably list recent posts from a creator outside of Patreon's mobile/web clients.

- The public API returns all the necessary data, but it's behind Cloudflare's scraping/bot protection.
- The developer API is creator-oriented, and doesn't support listing posts for campaigns the authenticated user didn't create. \
  _As of June 2020, this API is not actively maintained, so I'm skeptical of this becoming a feature any time soon._

Since exclusive content in posts is not publicly visible, readers can only show a placeholder. You'll need to open the link in Patreon's web client to see the complete post.

## Setup

If the above circumstances change, feel free to fork this! Here's how you can set up the necessary endpoints for your RSS reader with [Vercel](https://vercel.com).

### Create a deployment with Vercel

Make sure you have [Vercel CLI](https://vercel.com/docs/cli) installed and that you're logged in.

```sh
git clone https://github.com/nchlswhttkr/patreon-rss-poc
cd patreon-rss-poc
yarn && vc
```

Note down your production URL, you'll need it for the next step.

### Export your pledged creators to an OPML file for your RSS reader

A patron's pledges are private by default, so you'll need to [create a client in Patreon](https://www.patreon.com/portal/registration/register-clients) and to request this data via an OAuth2 flow. The redirect URL will be the URL of your Vercel deployment combined with the callback path, something similar to `https://patreon-rss-poc.nchlswhttkr.vercel.app/api/callback`.

Create your app and note your client ID and secret. Now you can redeploy your Vercel application with the necessary environment variables

```sh
vc --prod -e PATREON_CLIENT_ID=<client-id> -e PATREON_CLIENT_SECRET=<client-secret> -e BASE_URL=<vercel-deployment-url>
```

| Environment variables   | Description                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `PATREON_CLIENT_ID`     | The client ID that identifies your application to Patreon's developer API                               |
| `PATREON_CLIENT_SECRET` | The secret token that authenticates your application to Patreon's developer API                         |
| `BASE_URL`              | The root URL for your Vercel deployment (for example `https://patreon-rss-poc.nchlswhttkr.vercel.app/`) |

Visit your deployment now, and you'll be redirected to grant permissions to your application in Patreon.

After approving and being redirected, your browser will download your `pledged-creators.opml` file. You can see a sample OPML file in [`./sample-files/pledged-creators.opml`](./sample-files/pledged-creators.ompl).

If you pledge to a new creator in future, just go through the auth flow again to get a new OPML file.

### Fetch a creator's posts as an RSS feed

The second part of this Vercel deployment provides routes to fetch the latest posts from a specified creator, returning them in a form that RSS readers can ingest.

Currently, Cloudflare's bot protection prevents this scraping from the public API though.

You can see a sample RSS feed at [`./sample-files/feed.xml`](./sample-files/feed.xml). Patron-exclusive content will need to opened in the Patreon web client to be viewed.

---

## Further considerations

- Support for rich responses: preview images, links for video posts, better placeholders for paid content
- Clean up code: There's no error handling or typing on API responses at the moment.
