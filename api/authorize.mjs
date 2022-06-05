export default (req, res) => {
  // prettier-ignore
  res.setHeader('Location', `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env['PATREON_CLIENT_ID']}&redirect_uri=${process.env['BASE_URL']}api/callback&scope=identity.memberships`)
  res.status(302);
  res.send("");
};
