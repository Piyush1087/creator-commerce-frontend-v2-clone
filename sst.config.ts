/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "creatorshop-fe",
      removal: input?.stage === "prod" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
          profile: input?.stage === "prod" ? "creator-prod" : "creator-dev",
        },
      },
    };
  },
  async run() {
    const path = await import("path");
    const dotenv = await import("dotenv");
    const fs = await import("fs");
    const cwd = process.cwd();
    const envPaths = [
      path.join(cwd, ".env"),
      path.join(cwd, "creator-commerce-frontend-v2", ".env"),
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        break;
      }
    }

    const razorpayPublicKeyId =
      process.env.VITE_RAZORPAY_KEY_ID?.trim() ||
      process.env.RAZORPAY_API_KEY_ID?.trim() ||
      "";
    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

    const defaultPublicAppUrl =
      $app.stage === "prod"
        ? "https://dashboard.thecreatorshop.in"
        : "https://dashboard.dev.thecreatorshop.in";

    new sst.aws.StaticSite("react-app", {
      transform: {
        cdn: (args) => {
          args.customErrorResponses = [
            {
              errorCachingMinTtl: 0,
              errorCode: 403,
              responseCode: 200,
              responsePagePath: "/index.html",
            },
            {
              errorCachingMinTtl: 0,
              errorCode: 404,
              responseCode: 200,
              responsePagePath: "/index.html",
            },
          ];
          args.defaultRootObject = "index.html";
        },
      },
      build: {
        command: "npm run build",
        output: "dist",
      },
      environment: {
        VITE_API_URL:
          $app.stage === "prod"
            ? "https://api.thecreatorshop.in"
            : "https://api.dev.thecreatorshop.in",
        VITE_STAGE: $app.stage,
        VITE_GOOGLE_CLIENT_ID: googleClientId,
        VITE_RAZORPAY_KEY_ID: razorpayPublicKeyId,
        VITE_PUBLIC_APP_URL:
          $app.stage === "dev" || $app.stage === "prod"
            ? defaultPublicAppUrl
            : process.env.VITE_PUBLIC_APP_URL?.trim() || "",
      },
      domain: {
        dns: false,
        name:
          $app.stage === "prod"
            ? "dashboard.thecreatorshop.in"
            : "dashboard.dev.thecreatorshop.in",
        cert:
          $app.stage === "prod"
            ? "arn:aws:acm:us-east-1:250037328530:certificate/81e812b2-f13e-4147-852a-816d9b5e241a"
            : "arn:aws:acm:us-east-1:841162679642:certificate/64d8dd77-86d4-42f6-a4b7-d0cb71e52d58",
      },
    });
  },
  console: {
    autodeploy: {
      target: (event) => {
        if (
          event.type === "branch" &&
          event.branch === "main" &&
          event.action === "pushed"
        ) {
          return {
            stage: "dev",
          };
        }
      },
    },
  },
});
