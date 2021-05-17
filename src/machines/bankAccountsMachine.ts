import { omit } from "lodash/fp";
import { dataMachine } from "./dataMachine";
import { httpClient } from "../utils/asyncUtils";
import { backendPort } from "../utils/portUtils";

export const bankAccountsMachine = dataMachine("bankAccounts").withConfig({
  services: {
    fetchData: async (ctx, event: any) => {
      const resp = await httpClient.post(`http://localhost:${backendPort}/graphql`, {
        query: `query {
           ListBankAccount {
            id
            uuid
            userId
            bankName
            accountNumber
            routingNumber
            isDeleted
            createdAt
            modifiedAt
           }
          }`,
      });
      return { results: resp.data.data.ListBankAccount, pageData: {} };
    },
    deleteData: async (ctx, event: any) => {
      const payload = omit("type", event);
      const resp = await httpClient.post(`http://localhost:${backendPort}/graphql`, {
        query: `mutation DeleteBankAccount ($id: ID!) {
          DeleteBankAccount(id: $id)
        }`,
        variables: payload,
      });
      return resp.data;
    },
    createData: async (ctx, event: any) => {
      const payload = omit("type", event);
      const resp = await httpClient.post(`http://localhost:${backendPort}/graphql`, {
        query: `mutation CreateBankAccount ($bankName: String!, $accountNumber: String!,  $routingNumber: String!) {
          CreateBankAccount(
            bankName: $bankName,
            accountNumber: $accountNumber,
            routingNumber: $routingNumber
          ) {
            id
            uuid
            userId
            bankName
            accountNumber
            routingNumber
            isDeleted
            createdAt
          }
        }`,
        variables: payload,
      });
      return resp.data;
    },
  },
});
