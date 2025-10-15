// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { init, addInterface } from './commands'
import { InterfaceManager } from './veiws/InterfaceManager/index'
import path = require('path')

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('contract-to-ts.helloWorld', () => {
      vscode.window.showInformationMessage('Hello World from contract-to-ts!')
    }),
    vscode.commands.registerCommand('contract-to-ts.init', init),
    vscode.commands.registerCommand('contract-to-ts.addInterface', addInterface)
  )
  
  // 创建接口管理器，自动开始监听类型文件目录
  const interfaceManager = new InterfaceManager(context)
  context.subscriptions.push(interfaceManager)
}

// This method is called when your extension is deactivated
export function deactivate() {}
