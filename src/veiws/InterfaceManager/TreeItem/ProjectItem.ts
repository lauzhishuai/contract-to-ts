import { readdirSync, statSync, existsSync, readFileSync, stat } from 'fs'
import path = require('path')
import {
  TreeItem,
  TreeItemCollapsibleState,
  ThemeIcon,
  ProviderResult,
  workspace,
  Uri,
  FileType,
  TelemetryTrustedValue,
} from 'vscode'
import { MyTreeDataProvider } from '../TreeDataProvider'
import { InterfaceItem, InterfaceType } from './InterfaceItem'
import { ServiceItem } from './ServiceItem'
import { InitProject } from '../../../index'
import { isFileExist } from '../../../utils'

/**
 * @class ProjectCategory 项目分类项
 */
export class ProjectItem extends TreeItem {
  private typesRootUri: Uri
  private ctx: MyTreeDataProvider
  private visiable: boolean = false
  public readonly project: InitProject

  constructor(project: InitProject, ctx: MyTreeDataProvider) {
    const { name, config } = project
    super(name, TreeItemCollapsibleState.Expanded)
    this.ctx = ctx
    this.project = project
    this.iconPath = new ThemeIcon('folder')
    this.visiable = !!config.typeFileDir
    this.contextValue = 'project-folder'
    this.init(project)
    this.doProjectWatch()
  }

  /**
   * @description: 设置类型文件根目录
   * @param {InitProject} project
   */
  init(project: InitProject) {
    if (!project) {
      throw new Error('No project information!')
    }
    const { config, uri } = project
    this.typesRootUri = Uri.joinPath(uri, config.typeFileDir)
  }

  getChildren(): ProviderResult<TreeItem[]> {
    if (!this.typesRootUri) {
      return Promise.resolve([])
    }
    const serviceMap: Map<string, ServiceItem> = new Map()
    const typeRootPath = this.typesRootUri.fsPath
    return isFileExist(this.typesRootUri).then((isExist) => {
      if (!isExist) {
        return []
      }
      // 读取类型文件目录
      readdirSync(typeRootPath)
        // 获取目录下具有 interfaceInfo.json、index.ts的文件目录
        .filter((file) => {
          const filePath = path.join(typeRootPath, file)
          const stat = statSync(filePath)
          // 过滤非目录文件
          if (!stat.isDirectory()) {
            return false
          }
          const infoFilePath = path.join(filePath, 'interfaceInfo.json')
          const typeFilePath = path.join(filePath, 'index.ts')
          // 过滤空目录
          if (!existsSync(infoFilePath) || !existsSync(typeFilePath)) {
            return false
          }
          const infoFileStat = statSync(infoFilePath)
          const typeFileStat = statSync(typeFilePath)
          // 过滤空文件
          return !!infoFileStat.size && !!typeFileStat.size
        })
        .forEach((intfDir) => {
          const infoPath = path.join(typeRootPath, intfDir, 'interfaceInfo.json')
          const interfaceInfo = JSON.parse(
            readFileSync(infoPath, { encoding: 'utf-8' })
          ) as InterfaceType
          interfaceInfo.methodUri = Uri.joinPath(this.typesRootUri, intfDir)
          const { serviceCode } = interfaceInfo
          const serviceCate = serviceMap.get(serviceCode)
          if (serviceCate) {
            serviceCate.addInterface(
              new InterfaceItem(interfaceInfo, serviceCate)
            )
          } else {
            const newServiceCate = new ServiceItem(interfaceInfo, [], this)
            const newInterface = new InterfaceItem(
              interfaceInfo,
              newServiceCate
            )
            newServiceCate.addInterface(newInterface)
            serviceMap.set(serviceCode, newServiceCate)
          }
        })

      return Array.from(serviceMap.values())
    })
  }

  doProjectWatch() {
    const typesRootPath = this.typesRootUri.fsPath
    const wathder = workspace.createFileSystemWatcher(`${typesRootPath}/**/*`)
    wathder.onDidChange(() => {
      console.info('onDidChange')
      this.ctx.refresh()
    })
    wathder.onDidCreate(() => {
      console.info('onDidCreate')
      this.ctx.refresh()
    })
    wathder.onDidDelete(() => {
      console.info('onDidDelete')
      this.ctx.refresh()
    })
  }
  public isVisible(): boolean {
    return this.visiable
  }
}
