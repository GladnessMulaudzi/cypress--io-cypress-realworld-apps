// @ts-check
/// <reference path="../global.d.ts" />

import { pick } from "lodash/fp";
import chaiDatetime from "chai-datetime";
import { format as formatDate } from "date-fns";

chai.use(chaiDatetime);

const defaultPassword = Cypress.env("defaultPassword");

Cypress.Commands.add("login", (username, password, rememberUser = false) => {
  const signinPath = "/signin";
  const log = Cypress.log({
    name: "login",
    displayName: "LOGIN",
    // @ts-ignore
    message: `🔐 Authenticating | ${username}`,
  });

  cy.server();
  cy.route("POST", "/login").as("loginUser");
  cy.route("GET", "checkAuth").as("getUserProfile");

  cy.location("pathname", { log: false }).then((currentPath) => {
    if (currentPath !== signinPath) {
      cy.visit(signinPath);
    }
  });

  log.snapshot("before");

  cy.getTest("signin-username").type(username);
  cy.getTest("signin-password").type(password);

  if (rememberUser) {
    cy.getTest("signin-remember-me").find("input").check();
  }

  cy.getTest("signin-submit").click();
  cy.wait(["@loginUser", "@getUserProfile"]).spread(
    (loginUser, getUserProfile) => {
      log.set({
        consoleProps() {
          return {
            username,
            password,
            rememberUser,
            userId: getUserProfile.response.body.user.id,
          };
        },
      });

      // Question: what is the "2" state in between before and after snapshots
      log.snapshot("after");
      log.end();
    }
  );
});

Cypress.Commands.add("loginByApi", (username, password = defaultPassword) => {
  return cy.request("POST", `${Cypress.env("apiUrl")}/login`, {
    username,
    password,
  });
});

Cypress.Commands.add(
  "loginByXstate",
  (username, password = defaultPassword) => {
    cy.visit("/signin");

    return cy
      .window()
      .its("authService")
      .invoke("send", ["LOGIN", { username, password }]);
  }
);

Cypress.Commands.add("logoutByXstate", () => {
  return cy.window().its("authService").invoke("send", ["LOGOUT"]);
});

Cypress.Commands.add("createTransaction", (payload) => {
  return cy
    .window()
    .its("createTransactionService")
    .then((service) => {
      service.send("SET_USERS", payload);

      const createPayload = pick(
        ["amount", "description", "transactionType"],
        payload
      );

      service.send("CREATE", {
        ...createPayload,
        senderId: payload.sender.id,
        receiverId: payload.receiver.id,
      });
    });
});

Cypress.Commands.add("nextTransactionFeedPage", (service, page) => {
  return cy
    .window()
    .its(service)
    .then((service) => {
      // @ts-ignore
      return service.send("FETCH", { page });
    });
});

Cypress.Commands.add("pickDateRange", (startDate, endDate) => {
  const log = Cypress.log({
    name: "pickdaterange",
    displayName: "PICK DATE RANGE",
    // @ts-ignore
    message: `🗓 ${startDate.toDateString()} to ${endDate.toDateString()}`,
    consoleProps() {
      return {
        startDate,
        endDate,
      };
    },
  });

  const selectDate = (date) => {
    return cy
      .get(`[data-date='${formatDate(date, "YYYY-MM-DD")}']`)
      .click({ force: true });
  };

  log.snapshot("before");

  // Focus initial viewable date picker range around target start date
  // @ts-ignore: Cypress expects wrapped variable to be a jQuery type
  cy.wrap(startDate.getTime()).then((now) => cy.clock(now, ["Date"]));

  // Open date range picker
  cy.getTestLike("filter-date-range-button").click({ force: true });

  // Select date range
  selectDate(startDate);
  selectDate(endDate).then(() => {
    log.snapshot("after");
    log.end();
  });
});

Cypress.Commands.add("getTest", (s) => cy.get(`[data-test=${s}]`));
Cypress.Commands.add("getTestLike", (s) => cy.get(`[data-test*=${s}]`));
