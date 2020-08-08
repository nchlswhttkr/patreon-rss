import { NowRequest, NowResponse } from "@vercel/node";
import got from "got";

export default async (req: NowRequest, res: NowResponse) => {
  // TODO Prefer to pass sensitive credentials as form data over query params
  // prettier-ignore
  const { access_token } = await got(`https://www.patreon.com/api/oauth2/token?grant_type=authorization_code&code=${req.query.code}&client_id=${process.env['PATREON_CLIENT_ID']}&client_secret=${process.env['PATREON_CLIENT_SECRET']}&redirect_uri=${process.env['BASE_URL']}api/callback`, { method: 'POST' }).json()

  // prettier-ignore
  const { included: resources } = await got('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign.creator&fields%5Buser%5D=full_name', { headers: { 'Authorization': `Bearer ${access_token}` } }).json()
  let creators = {};
  for (let resource of resources) {
    if (resource.type === "user") {
      creators[resource.id] = resource.attributes.full_name;
    }
  }
  let campaigns = [];
  for (let resource of resources) {
    if (resource.type === "campaign") {
      campaigns.push({
        id: resource.id,
        name: creators[resource.relationships.creator.data.id],
      });
    }
  }

  let opml = `<opml version="1.1">
<body>
<outline text="Patreon Creators" title="Patreon Creators">
`;
  for (let campaign of campaigns) {
    opml += `<outline text="${campaign.name}" title="${campaign.name}" type="rss" xmlUrl="${process.env["BASE_URL"]}api/feed/${campaign.id}" />`;
  }
  opml += `
</body>
</opml>
`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="pledged-creators.opml"`
  );
  res.send(opml);
};
