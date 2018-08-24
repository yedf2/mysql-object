my-orm
====

a very lightweight mysql orm library



### 添加权限
将自己的public key给运维人员，运维人员添加权限，包括gitlab权限和服务器权限

### 配置翻墙
安装shadowsocks，让运维人员输入用户名密码

### win10专用
重要的事情说三遍
- 请先卸载所有杀毒软件
- 请先卸载所有杀毒软件
- 请先卸载所有杀毒软件
- 请更新至1709版本以上，此说明的配置在该版本上测试通过

启用linux子系统

* 设置中 更新安全 -> 针对开发人员 -> 开发人员模式 等待配置完成
* 设置中搜索 启用或关闭windows功能，选中“适用于linux的windows子系统”
* 重启之后 通过microsoft store安装ubuntu
* c盘根目录下创建子目录ivy 这个要通过界面操作，否则没有权限
* 进入ubuntu命令行，运行
```
apt-get install unzip zsh
cd /mnt/c/ivy/
wget -O cmder.zip http://admin.ivydad.com/api/u/132
unzip *.zip
```
* 通过界面打开 c:\ivy\cmder_mini\cmder.exe

之后的操作默认都在这个命令窗口下执行

### mac专用
item2 比mac自带的terminal更好用

https://www.iterm2.com/downloads.html

### 安装oh-my-zsh
```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```
<font color=#ff0>windows用户需要修改 ~/.zshrc 找到并设置ZSH_THEME="ys"</font>否则有个光标的小bug
```
vim ~/.zshrc
# 修改找到并设置ZSH_THEME 后保存退出
source ~/.zshrc
```

### 安装node

```
# 使用nvm管理node版本
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | zsh
echo 'export NVM_DIR=~"/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
export NVM_NODEJS_MIRROR=https://npm.taobao.org/mirrors/node
source ~/.zshrc
zsh
nvm install v8
npm config set registry https://registry.npm.taobao.org
npm config set sass_binary_site https://npm.taobao.org/mirrors/node-sass/
npm i -g yarn typescript cross-env vnpm ts-node pm2 babel-cli mocha wepy-cli nodemon
yarn config set registry 'https://registry.npm.taobao.org'
```

### 开发工具配置

#### git

``` bash
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global core.autocrlf input
```
#### chrome
扩展：Vue.js devtools

#### vscode

下载安装vscode

MAC: 
* 打开vscode
* 打开命令面板 (⇧⌘P 或者左下角的设置图标)
* 输入shell，选择"Shell Command: Install 'code' command in PATH"

安装vscode扩展 <font color=#ff0>windows下用户需要在普通cmd下面运行下面命令</font>

```
code --install-extension formulahendry.auto-close-tag
code --install-extension cipchk.cssrem
code --install-extension EditorConfig.editorconfig
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens
code --install-extension christian-kohler.npm-intellisense
code --install-extension eg2.ts-tslint
code --install-extension octref.vetur
```

配置vscode
```
// 将设置放入此文件中以覆盖默认设置
{
    "vetur.validation.template": false, // 临时使用
    "eslint.validate": [ // eslint提示
        "javascript",
        "javascriptreact",
        { "language": "vue", "autoFix": true},
        { "language": "html", "autoFix": true}
    ],
    "editor.wordWrap": "on", // 长行换行
    "files.autoSave": "onFocusChange", // 自动保存文件内容
    "search.useIgnoreFilesByDefault": true, // 忽略gitignore中的文件
    "search.exclude": { // 搜索时忽略目录
        "**/node_modules": true,
        "**/dist": true,
        "**/bower_components": true
    },
    "window.openFilesInNewWindow": "on",
    "window.restoreFullscreen": true,
    "window.nativeTabs": true,
    // git bash目录
    "terminal.integrated.shell.osx": "zsh",
    "terminal.integrated.shell.windows": "c:\\windows\\sysnative\\cmd.exe",
    "terminal.integrated.shellArgs.windows": ["/K", "c:\\ivy\\cmder_mini\\vscode.bat"],
    "editor.tabSize": 2, // tab为两空格
    "git.enableSmartCommit": true,
    "window.zoomLevel": 0,
    // git lens插件配置
    "gitlens.defaultDateFormat": "YYYY-MM-DD HH:mm:SS",
    "gitlens.annotations.file.gutter.format": "${id} ${author|12-} ${date}",
    "workbench.panel.location": "bottom",
    "gitlens.advanced.messages": {
        "suppressCommitHasNoPreviousCommitWarning": false,
        "suppressCommitNotFoundWarning": false,
        "suppressFileNotUnderSourceControlWarning": false,
        "suppressGitVersionWarning": false,
        "suppressLineUncommittedWarning": false,
        "suppressNoRepositoryWarning": false,
        "suppressResultsExplorerNotice": false,
        "suppressShowKeyBindingsNotice": true,
        "suppressUpdateNotice": true,
        "suppressWelcomeNotice": true
    },
    "files.associations": { // wpy关联到vue
        "*.wpy": "vue"
    },
    "git.confirmSync": false,
    "extensions.ignoreRecommendations": false,
    "gitlens.blame.format": "${id} ${author|12-} ${date}",
    "javascript.validate.enable": false,
    "explorer.confirmDelete": false,
    "gitlens.keymap": "alternate"
}```
#### mysql
安装 mysqlworkbench

#### 可以选择安装webstorm
license server为 http://v.epeijing.cn:1017

#### 继续用之前的id_rsa
```
cp -fr /mnt/c/User/yourUserName/.ssh ~/
chmod -x ~/.ssh/*
chmod 400 ~/.ssh/id_rsa
```

#### windows下的ubuntu子系统 /mnt/c 目录对应的是 c盘。可以在这个目录下找到老项目 或者 重新获取项目代码。用vscode打开
```
cd /mnt/c/ivy && mkdir code && cd code && ivy-setup env && ivy-setup api && ivy-setup admin
```

### 获取项目代码
```bash
mkdir ivy && cd ivy
for p in env api admin admin-example do
ivy-setup $p
done

```

### 服务器配置
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:rotateInterval '0 2 * * *'  #每天轮转日志一次
pm2 set pm2-logrotate:max_size 1G
pm2 set pm2-logrotate:retain 7
pm2 startup centos # 开机启动pm2
pm2 save # 保存当前的pm2任务

git clone git://github.com/kongjian/tsar.git
cd tsar
make
make install
tsar -l -i 1

```
