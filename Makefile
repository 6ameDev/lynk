VERSION := $(shell node -p "require('./package.json').version")

.PHONY: release-major release-feature release-fix

release-major:
	@$(MAKE) release TYPE=major

release-feature:
	@$(MAKE) release TYPE=minor

release-fix:
	@$(MAKE) release TYPE=patch

release:
	@if [ -z "$(TYPE)" ]; then \
		echo "TYPE is required (major | minor | patch)"; \
		exit 1; \
	fi
	@node ./scripts/bump-version.js $(TYPE)
	@NEW_VERSION=$$(node -p "require('./package.json').version"); \
	git commit -am "Release $$NEW_VERSION"; \
	git tag v$$NEW_VERSION; \
	git push origin main --tags
