# Japanese runtime for Suzerain-jp

Upstream MagicalAstrogy/MagVarUpdate commit 0a730cd4a9b99689d1135a49b542c780b977c24c. Source code is preserved except the Japanese message dictionary, locale selection, six translated help pages and button labels. Japanese translations reuse the existing project translation memory, without any translation API. Original Chinese/English source dictionaries are retained for comparison.

The schema adapter uses StageDog/tavern_resource commit 14e03abb53e56210b0351ef02873739c967c5406; its source, Japanese visible messages and AFPL license are under vendor-source/tavern_resource.

The original package manifest is upstream-package.json. package.json and package-lock.json record the exact reused build toolchain; runtime external imports are independently frozen in ../../DEPENDENCIES.json. Build with npm ci --legacy-peer-deps --ignore-scripts, then CI=true npm run build and CI=true node node_modules/webpack-cli/bin/cli.js --config build-zod.config.ts --mode production. Rewrite resulting external imports using the dependency ledger. Delivery excludes source-map hints. Host globals (jQuery, lodash, Vue, Zod, YAML, toastr and Tavern Helper APIs) remain host-owned.
