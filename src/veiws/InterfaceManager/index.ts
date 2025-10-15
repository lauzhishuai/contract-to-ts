import { commands, window } from 'vscode'
import { MyTreeDataProvider } from './TreeDataProvider'
import { addInterfaceToProject } from './commands/addInterfaceToProject'
import { addInterfaceFromService } from './commands/addInterfaceFromService'
import { linkToInterface } from './commands/linkToInterface'
import { deleteInterface } from './commands/deleteInterface'
import { updateInterface } from './commands/updateInterface'
import { viewInterface } from './commands/viewInterface'

export class InterfaceManager {
  private context
  private provider

  constructor(context) {
    this.context = context
    this.provider = new MyTreeDataProvider()
    console.log('provider', this.provider)

    // 创建管理视图
    window.createTreeView('interface-manager', {
      treeDataProvider: this.provider,
    })

    this.context.subscriptions.push(
      commands.registerCommand(
        'contract-to-ts.addInterfaceToProject',
        addInterfaceToProject
      ),
      commands.registerCommand(
        'contract-to-ts.addInterfaceFromService',
        addInterfaceFromService
      ),
      commands.registerCommand(
        'contract-to-ts.linkToInterface',
        linkToInterface
      ),
      commands.registerCommand(
        'contract-to-ts.deleteInterface',
        deleteInterface
      ),
      commands.registerCommand(
        'contract-to-ts.updateInterface',
        updateInterface
      ),
      commands.registerCommand('contract-to-ts.viewInterface', viewInterface)
    )
  }

  public refresh() {
    this.provider?.refresh()
  }

  public dispose() {
    // 清理资源
    this.provider?.dispose()
  }
}
