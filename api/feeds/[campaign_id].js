import got from "got";

export default async (req, res) => {
  // optionally filter to show only unlocked tiers, but keep patron/public posts
  const filter_by_tier_id = req.query.tier_id
    ? `&filter[all_patrons]=true&filter[is_public]=true&filter[tier_id]=${req.query.tier_id}`
    : "";

  // prettier-ignore
  const { data, included } = await got(`https://www.patreon.com/api/posts?filter[campaign_id]=${req.query.campaign_id}&filter[contains_exclusive_posts]=true&sort=-published_at` + filter_by_tier_id).json()

  // TODO Confirm the creator is the first returned user, otherwise wrong name
  const title = included.find((i) => i.type === "user").attributes.full_name;
  const link = included.find((i) => i.type === "campaign").attributes.url;
  const description =
    included.find((i) => i.type === "campaign").attributes.one_liner ||
    `Posts from ${title}`;

  let rss = `
<rss version="2.0">
<channel>
<title>${sanitise(title)}</title>
<link>${link}</link>
<description>${sanitise(description)}</description>
`;
  for (let post of data) {
    rss += `
<item>
    <title>${sanitise(post.attributes.title)}</title>
    <link>${post.attributes.url}</link>
    <description>${sanitise(
      post.attributes.content ||
        `This post is exclusive to ${title} patrons, you can view it on <a href="${post.attributes.url}">Patreon</a>.`
    )}</description>
    <guid>${post.attributes.url}</guid>
    <pubDate>${post.attributes.published_at}</pubDate>
</item>
`;
  }
  rss += `
</channel>
</rss>
`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=14400"); // 4 hours
  res.send(rss);
};

// Some fields are not sanitised for XML, and include dangerous characters
function sanitise(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

/*
https://www.rssboard.org/rss-specification#requiredChannelElements
title                   campaign.creator.full_name
link                    campaign.url
description             campaign.one_liner || "Posts from {campaign.creator.full_name}"
item
    title               post.title
    link                post.url
    pubDate             post.published_at
    guid                post.url
    description         post.content || post.is_paid || "Must pledge at least {post.min_cents_to_view} cents to view"
*/
