const readline = require("readline");
const child_process = require("child_process");
const { getObject } = require("./db");

/**
 * @description 封装 child_process.exec 为 promise
 */
const execAysnc = (cmd) => {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout.replace(/[\r\n]/g, ""), stderr });
    });
  });
};

class Account {
  username = "";
  email = "";
  flag = "";

  constructor(username, email, flag = "") {
    this.username = username;
    this.email = email;
    this.flag = flag;
  }

  static isEqual(accountA, accountB) {
    if (
      accountA.username === accountB.username &&
      accountA.email === accountB.email
    ) {
      return true;
    }
    return false;
  }

  stringify() {
    return `${this.flag} | ${this.username} | ${this.email}`;
  }
}

/**
 * @description 执行 git 命令获取全局和当前存储库用户配置
 */
const logCurrentConfig = async () => {
  const { stdout: localUserName } = await execAysnc(`git config user.name`);
  const { stdout: localEmail } = await execAysnc(`git config user.email`);
  const { stdout: globalUserName } = await execAysnc(
    `git config --global user.name`
  );
  const { stdout: globalEmail } = await execAysnc(
    `git config --global user.email`
  );

  const localAccount = new Account(localUserName, localEmail, "-");
  const globalAccount = new Account(globalUserName, globalEmail, "-");

  const { accounts } = await getObject();
  for (const flag in accounts) {
    if (Account.isEqual(localAccount, accounts[flag])) {
      localAccount.flag = flag;
    }
    if (Account.isEqual(globalAccount, accounts[flag])) {
      globalAccount.flag = flag;
    }
  }

  console.log(`[Global]`, globalAccount.stringify());
  console.log(`[Local]`, localAccount.stringify());
};

/**
 * @description 以表格的形式打印出已保存的账号
 * @param {*} obj
 */
const listAccounts = async (obj) => {
  const { accounts } = obj || (await getObject());
  const arr = [];
  for (const flag in accounts) {
    arr.push({
      flag,
      ...accounts[flag],
    });
  }
  console.table(arr);
};

/**
 * @description 使用一个账号
 */
const useAnAccount = async (flag, account, isGlobal = false) => {
  const { username, email } = account;
  child_process.exec(
    `git config ${isGlobal ? "--global" : ""}  user.name "${username}"`
  );
  child_process.exec(
    `git config ${isGlobal ? "--global" : ""} user.email "${email}"`
  );
  console.log(
    `🎉 Toggle success (scope: ${isGlobal ? "global" : "local repository"}).`
  );
  await logCurrentConfig();
};

/**
 * @description 通过命令行交互的方式，在已存储的列表中选择一个账号
 */
const selectAnAccount = async (obj, isGlobal = false) => {
  const _obj = obj || (await getObject());
  const { accounts } = _obj;

  if (!Object.keys(accounts).length) {
    console.log("🤚 No account can be selected, please add an account first.");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Please select a index or flag: `, (input) => {
    rl.close();
    const isIndex = !isNaN(Number(input));

    const flag = isIndex ? Object.keys(accounts)[input] : input;
    const account = accounts[flag];

    if (!account) {
      console.log("❌ No this index or flag");
      return selectAnAccount(_obj, isGlobal);
    } else {
      return useAnAccount(flag, account, isGlobal);
    }
  });
};

module.exports = {
  logCurrentConfig,
  listAccounts,
  useAnAccount,
  selectAnAccount,
};
