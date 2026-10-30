# MystickynotesWebapp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

### VPS and container nginx

`nginx/default.conf` belongs to the final Docker image. It serves the compiled Angular
files; `ng serve` does not use it. A VPS nginx in front of this container normally
handles TLS and proxies traffic to the container. Keep both when using that layout.
If the VPS nginx serves `dist/mystickynotes_webapp/browser/` directly, the Angular
container is unnecessary; configure the SPA fallback and asset headers on the VPS
instead. Do not remove the container server while the VPS still proxies to it.

The container compresses text assets, caches hashed JS/CSS files for one year,
and requires revalidation of `index.html`. Missing assets return 404 instead of HTML.
Ensure the outer proxy preserves these cache headers and does not cache HTML as an
immutable asset. Rebuild/redeploy the image for configuration changes to take effect.

After deployment, check a deep link, `index.html` Cache-Control, hashed JS
Cache-Control and `Content-Encoding: gzip` (send `Accept-Encoding: gzip`). Confirm
missing `.js` requests return 404. Test login A → logout → login B without reloading;
workspace requests must use B's token and workspace IDs. Measure cold first load and
first navigation separately in browser Network/Performance tools; local builds alone
cannot establish production latency.

Session regression checks:

```bash
node node_modules/@angular/cli/bin/ng.js test --watch=false --ts-config tsconfig.session-regression.json --include src/app/public/auth/services/session-regression.spec.ts --include src/app/public/auth/services/auth-service.spec.ts --include src/app/public/auth/state/auth.store.spec.ts --include src/app/private/workspace/services/workspace-dropdown.store.spec.ts --include src/app/guards/auth.guard.spec.ts --include src/app/shared/services/app-preloading.strategy.spec.ts
```

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
