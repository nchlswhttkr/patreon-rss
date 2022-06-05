# Patreon RSS

Get notified via RSS of new public/exclusive posts from your pledged creators on Patreon.

> **Warning**
>
> Patreon has implemented controls to prevent scraping of their public API, and so this little service no longer works.

<!-- TODO Support for rich responses: preview images, links for video posts -->
<!-- TODO Clean up code: There's no error handling or typing on API responses at the moment. -->

## Usage

[Log in with Patreon](https://patreon-rss.nicholas.cloud/) to get an OPML file containing feeds for each of your pledged creators.

Import this OPML into your RSS reader of choice.

Whenever you pledge to new creators, use this link to get an updated OPML file.

## Setup

This service is hosted with [Vercel](https://vercel.com). You can create your own deployment with these steps.

### Create a project with Vercel

Make sure you have [Vercel CLI](https://vercel.com/docs/cli) installed and that you're logged in.

```sh
git clone https://github.com/nchlswhttkr/patreon-rss
cd patreon-rss
nvm use
npm ci
vercel
```

Note down your production URL, you'll need it for the next step.

### Create a Patreon API client

Since pledges are private by default, you'll need to [register an API client in Patreon](https://www.patreon.com/portal/registration/register-clients) to access this data.

The redirect URL will be the production URL from the previous step, appended with the callback path (`/api/callback`). This should resemble `https://patreon-rss.nicholas.cloud/api/callback`.

After creating your API client, note down your client ID and secret.

### Configure your Vercel deployment

You'll need to configure a few environment variables in your project settings via the Vercel dashboard.

| Name                    | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`              | The production URL for your Vercel project with a trailing slash, for example `https://patreon-rss.vercel.app/` |
| `PATREON_CLIENT_ID`     | Your Patreon API client ID                                                                                      |
| `PATREON_CLIENT_SECRET` | The secret token that authenticates your Patreon API client                                                     |

With this done, create a new production deployment.

```sh
vercel --prod
```

Congratulations, your project is ready to go!
