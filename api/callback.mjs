import got from "got";

export default async (req, res) => {
  // TODO Prefer to pass sensitive credentials as form data over query params
  // prettier-ignore
  const { access_token } = await got(`https://www.patreon.com/api/oauth2/token?grant_type=authorization_code&code=${req.query.code}&client_id=${process.env['PATREON_CLIENT_ID']}&client_secret=${process.env['PATREON_CLIENT_SECRET']}&redirect_uri=${process.env['BASE_URL']}api/callback`, { method: 'POST' }).json()

  // prettier-ignore
  const { included: resources } = await got('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.campaign.creator,memberships.currently_entitled_tiers&fields%5Buser%5D=full_name', { headers: { 'Authorization': `Bearer ${access_token}` } }).json()

  // The campaign owner's name and the user's membership tier are separate
  // from the campaign itself, grab them now to connect together later
  let pledged_campaign_tier_by_creator_id = new Map();
  let creator_name_by_id = new Map();
  for (let resource of resources) {
    if (resource.type === "user") {
      creator_name_by_id.set(resource.id, resource.attributes.full_name);
    } else if (resource.type === "member") {
      if (resource.relationships.currently_entitled_tiers.data.length > 1) {
        res.status(500);
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
        res.send(`
          <h1 style="color: red;">Error</h1>
          <p>Encountered a user with multiple entitled tiers, aborting<p>
          <p>If possible, could you please use this link to <a href="https://github.com/nchlswhttkr/patreon-rss/issues/new?title=Encountered a user with multiple entitled tiers">open an issue on GitHub</a> for me to investigate?</p>`);
        return;
      } else if (
        resource.relationships.currently_entitled_tiers.data.length === 1
      ) {
        pledged_campaign_tier_by_creator_id.set(
          resource.relationships.campaign.data.id,
          resource.relationships.currently_entitled_tiers.data[0].id
        );
      }
    }
  }

  // Build list of campaigns, now knowing names/tiers
  let pledged_campaigns = [];
  for (let resource of resources.filter((r) => r.type === "campaign")) {
    if (pledged_campaign_tier_by_creator_id.has(resource.id)) {
      pledged_campaigns.push({
        id: resource.id,
        name: creator_name_by_id.get(resource.relationships.creator.data.id),
        tier_id: pledged_campaign_tier_by_creator_id.get(resource.id),
      });
    }
  }

  let opml = `<opml version="1.1">
<body>
<outline text="Patreon" title="Patreon">
`;
  for (let campaign of pledged_campaigns) {
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
