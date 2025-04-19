import dotenv from "dotenv";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import { TypeInput } from "supertokens-node/types";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserRoles from "supertokens-node/recipe/userroles";

dotenv.config();

export function getApiDomain() {
  const apiPort = process.env.PORT || 5000;
  const apiUrl =
    process.env.USERSERVICE_API_URL || `http://localhost:${apiPort}`;
  return apiUrl;
}

export function getWebsiteDomain() {
  console.log("supertokens: ", process.env.SUPERTOKENS_CORE_URL);
  const websitePort = process.env.VITE_APP_PORT || 5173;
  const websiteUrl =
    process.env.VITE_APP_UI_URL || `http://localhost:${websitePort}`;
  return websiteUrl;
}

export const SuperTokensConfig: TypeInput = {
  debug: process.env.NODE_ENV === "development",
  supertokens: {
    // this is the location of the SuperTokens core.
    connectionURI: process.env.SUPERTOKENS_CORE_URL || "http://localhost:3567",
  },
  appInfo: {
    appName: "SuperTokens Demo App",
    apiDomain: getApiDomain(),
    websiteDomain: getWebsiteDomain(),
  },
  // recipeList contains all the modules that you want to
  // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
  recipeList: [
    EmailPassword.init(),
    Session.init(),
    Dashboard.init(),
    UserRoles.init(),
  ],
};
