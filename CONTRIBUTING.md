# Contributing to VYNEDRES Atelier

## Development setup

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

## Branch naming

- `feature/short-description`
- `fix/short-description`
- `docs/short-description`

## Code standards

### API (`apps/api`)

- TypeScript strict mode
- Validate request bodies with Zod
- All tenant-scoped queries must filter by `tenantId`
- New routes go in `src/routes/`

### Web (`apps/web`)

- Next.js App Router
- Server components for data fetching where possible
- Tailwind for styling — use `vynedres-*` brand colors

### Infrastructure (`infra/terraform`)

- One module per Azure concern
- Run `terraform fmt` before committing
- Never commit `terraform.tfvars` or secrets

## Pull request checklist

- [ ] API types check (`npm run lint` in `apps/api`)
- [ ] Web builds (`npm run build` in `apps/web`)
- [ ] Terraform validates (`terraform validate`)
- [ ] No secrets in code
- [ ] Documentation updated if behavior changed
