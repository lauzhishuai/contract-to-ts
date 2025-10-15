import {
  TreeItem,
  TreeItemCollapsibleState,
  ProviderResult,
  ThemeIcon,
} from 'vscode'
import { ProjectItem } from './ProjectItem'
import { InterfaceItem } from './InterfaceItem'
import { getConfig, getContextValue } from '../../../utils'
import { Config, Context } from '../../../constants'
import { ServiceMetaData } from '../../../index'

export type ServiceCategoryMeta = ServiceMetaData

/**
 * @class ServiceCategory 服务分类项
 */
export class ServiceItem extends TreeItem {
  private interfaces: InterfaceItem[]
  private parent?: ProjectItem
  public readonly service: ServiceCategoryMeta
  constructor(
    service: ServiceCategoryMeta,
    interfaces: InterfaceItem[],
    parent?: ProjectItem
  ) {
    if (!service) {
      throw new Error('No service Infomation')
    }
    const { serviceCode, projectName } = service
    const isExpandAll = getContextValue(Context.isExpandAll)

    const displayType = getConfig(Config.ServiceDisplayType)
    const label = displayType === 'serviceCode' ? projectName : serviceCode
    // const description =
    //   displayType === 'serviceName' ? serviceCode : projectName
    super(
      label,
      isExpandAll
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.Collapsed
    )
    this.iconPath = new ThemeIcon('cloud')
    this.contextValue = 'service-item'
    // this.description = description
    this.interfaces = interfaces || []
    this.parent = parent
    this.service = service
  }
  getChildren(): ProviderResult<TreeItem[]> {
    return Promise.resolve(this.interfaces)
  }
  getParent() {
    return this.parent
  }

  getProjectConfig() {
    this.parent
  }

  addInterface(intf: InterfaceItem | InterfaceItem[]) {
    this.interfaces.push(...(Array.isArray(intf) ? intf : [intf]))
  }
}
