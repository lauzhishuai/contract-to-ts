import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'
import { ServiceItem } from './ServiceItem'
import { InterfaceMetaData, ServiceMetaData } from '../../../index'

export type InterfaceType = ServiceMetaData &
  InterfaceMetaData & {
    methodUri: Uri
  }

export class InterfaceItem extends TreeItem {
  public readonly method: InterfaceType
  private readonly parent: ServiceItem
  constructor(intf: InterfaceType, parent: ServiceItem) {
    const { methodName, version } = intf
    super(methodName, TreeItemCollapsibleState.None)
    this.description = `ver.${version}`
    this.contextValue = 'interface-item'
    this.method = intf
    this.parent = parent
    this.command = {
      title: '查看接口',
      command: 'contract-to-ts.showInterface',
      arguments: [this],
    }
    this.iconPath = new ThemeIcon('symbol-interface')
  }

  getProjectCategory() {
    return this.parent.getParent()
  }
  
  getServiceCategory() {
    return this.parent
  }
}
