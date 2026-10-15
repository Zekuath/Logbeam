# Security policy

Logbeam reads logs that may contain credentials, so security reports are taken seriously.

## Reporting a vulnerability

Please report it privately through GitHub:
[**Report a vulnerability**](https://github.com/andronaft/Logbeam/security/advisories/new). Don't open a public
issue for it.

Useful to include: what an attacker could do, the steps or a page that shows it, and the Logbeam version
(`chrome://extensions` or `about:addons`). You'll get an answer within a few days, and a fix goes out in a new
release as soon as it's ready. You'll be credited in the changelog unless you'd rather not be.

## In scope

- A web page that can run code in the extension, read what Logbeam shows or stores, or make it act on another site
- A secret that is shown or copied unmasked while **Mask** is on
- Anything that makes Logbeam send data over the network (it never should)

Only the latest version on the stores is supported.
