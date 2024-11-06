import { Page } from "@playwright/test";

interface Account {
    address: string,
    balance: string
}
class HomePage {
  page: Page;
  addAccountButton: string;
  refreshButton: string;
  reconnectButton: string;
  accountTable: string
  address: string
  balance: string
  constructor(page) {
    this.page = page;
    this.addAccountButton = '[data-test-id="add-account"]';
    this.refreshButton = '[data-test-id="refresh"]';
    this.accountTable = '[dat-test-id="accounts-table"]'
    this.address = '[dat-test-id="address"]'
    this.reconnectButton = '[data-test-id="reconnect"]'
    this.balance = '[data-test-id="balance"]'
  }

  async visit() {
    await this.page.goto('/');
  }

  async addAccount() {
    await this.page.locator(this.addAccountButton).click()
  }

  async getAccounts() {
    const accountList = await this.page.locator(this.accountTable).all();
    let accountFinalList
    accountList.forEach(async account => {
        const accountObject : Account = {
            address: await account.locator(this.address).innerText(),
            balance: await account.locator(this.balance).innerText(),
        }
        accountFinalList.push(accountObject)

    });
    return accountFinalList
  }

}

module.exports = HomePage;