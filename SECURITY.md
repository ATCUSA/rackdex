# Security policy

## Supported versions

RackDex is a continuously deployed static site. Only the latest version on the `main` branch (and the hosted site at
[rackdex.acole.dev](https://rackdex.acole.dev)) is supported.

## Reporting a vulnerability

**Please don't report security problems in a public issue.**

Use GitHub's private vulnerability reporting instead: go to this repository's **Security** tab and click
**Report a vulnerability**. If that isn't available, send a private message to the maintainer,
[@ATCUSA](https://github.com/ATCUSA), on GitHub.

Please include:

- what the problem is and where it is (file or URL)
- steps to reproduce it, or a proof of concept
- the impact you think it has

You can expect an acknowledgement within a few days. Once a fix ships, you'll be credited unless you'd prefer to stay
anonymous.

## Scope

RackDex runs entirely in the browser and has no accounts, backend or stored user data. Relevant reports include:

- script injection (XSS), for example through crafted YAML from the library being rendered unsafely
- anything that makes the site request or run content from an unexpected origin
- problems in the build script (`scripts/`) or the CI workflow

Problems in the device data itself belong upstream at
[netbox-community/devicetype-library](https://github.com/netbox-community/devicetype-library).
