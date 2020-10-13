import { NowRequest, NowResponse } from "@vercel/node";
import got from "got";

export default async (req: NowRequest, res: NowResponse) => {
  // TODO Prefer to pass sensitive credentials as form data over query params
  // prettier-ignore
  const { access_token } = await got(`https://www.patreon.com/api/oauth2/token?grant_type=authorization_code&code=${req.query.code}&client_id=${process.env['PATREON_CLIENT_ID']}&client_secret=${process.env['PATREON_CLIENT_SECRET']}&redirect_uri=${process.env['BASE_URL']}api/callback`, { method: 'POST' }).json()

  // prettier-ignore
  const { included: resources } = await got('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign.creator,memberships.currently_entitled_tiers&fields%5Buser%5D=full_name', { headers: { 'Authorization': `Bearer ${access_token}` } }).json()

  // The campaign owner's name and the end user's membership tiers are separate
  // from the campaign itself, grab them now to map later
  let campaign_tier = {};
  let creators = {};
  for (let resource of resources) {
    if (resource.type === "user") {
      creators[resource.id] = resource.attributes.full_name;
    } else if (resource.type === "member") {
      if (resource.relationships.currently_entitled_tiers.data.length > 1) {
        res.status(500);
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.send(`
          <h1 style="color: red;">Error</h1>
          <p>Encountered a user with multiple entitled tiers, aborting<p>
          <p>If possible, could you please use this link to <a href="https://github.com/nchlswhttkr/patreon-rss/issues/new?title=Encountered a user with multiple entitled tiers">open an issue on GitHub</a> for me to investigate?</p>`);
        return;
      }
      campaign_tier[resource.relationships.campaign.data.id] =
        resource.relationships.currently_entitled_tiers.data[0].id;
    }
  }

  // Build list of campaigns, now knowing names/tiers
  let campaigns = [];
  for (let resource of resources) {
    if (resource.type === "campaign") {
      campaigns.push({
        id: resource.id,
        name: creators[resource.relationships.creator.data.id],
        tier_id: campaign_tier[resource.id],
      });
    }
  }

  let opml = `<opml version="1.1">
<body>
<outline text="Patreon" title="Patreon">
`;
  for (let campaign of campaigns) {
    opml += `<outline text="${campaign.name}" title="${campaign.name}" type="rss" xmlUrl="${process.env["BASE_URL"]}api/feeds/${campaign.id}?tier_id=${campaign.tier_id}" />\n`;
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
