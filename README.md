# GAM - Git Account Manager

[English](./docs/en.md) | 中文

## 安装

```shell
npm i -g gitam
```

## 使用

在终端输入 `gam -h` 或 `gitam -h` 查看全部指令。

推荐优先使用 `gam` 指令。但可能在您的设备上，`gam` 指令已被占用，此时可以使用 `gitam` 指令代替。

## 功能

- ✅ 查看全局/当前存储库 git 用户
- ✅ 设定全局/当前存储库 git 用户
- ✅ 管理常用的 git 用户
- ✅ 快速切换已存储的 git 用户

## 例子

```shell
gam add github bob bob@email.com

gam add gitlab tom tom@email.com

gam use

gam use -g
```
