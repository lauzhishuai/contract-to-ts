/**
 * @description: 接口视图管理器
 */
import path = require('path')
import {
  TreeDataProvider,
  TreeItem,
  EventEmitter,
  workspace,
  ThemeIcon,
  ProviderResult,
  Event,
} from 'vscode'
import { ProjectItem } from './TreeItem/ProjectItem'
import { ServiceItem } from './TreeItem/ServiceItem'
import { getProjectsInfo } from '../../utils/index'

export class MyTreeDataProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
    new EventEmitter<TreeItem | undefined>()
  readonly onDidChangeTreeData: Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event

  constructor() {
    this.watchProject()
  }

  watchProject() {
    const watcher = workspace.createFileSystemWatcher(
      path.join(workspace.rootPath!, '**/*')
    )

    watcher.onDidChange((uri) => {
      if (uri.path.endsWith('package.json')) {
        this.refresh()
      }
    })

    watcher.onDidDelete((uri) => {
      if (uri.path.endsWith('package.json')) {
        this.refresh()
      }
    })
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    if (element instanceof ProjectItem) {
      // 项目信息目录
      element.iconPath = new ThemeIcon('folder')
    }
    return element
  }

  async getProjectsInfo() {
    const projectsInfo = []
    const projects = await getProjectsInfo()
    projects
      .filter((item) => !!item.config)
      .forEach((item) => {
        projectsInfo.push(new ProjectItem(item, this))
      })
    return Promise.resolve(projectsInfo.filter((item) => item.isVisible))
  }

  getChildren(element?: TreeItem) {
    // 无数据，根据package构建初始目录
    if (!element) {
      return this.getProjectsInfo()
    }
    if (element instanceof ProjectItem) {
      return element.getChildren()
    }
    if (element instanceof ServiceItem) {
      return element.getChildren()
    }
  }

  getParent(element: TreeItem): ProviderResult<TreeItem> {
    return element
  }

  refresh() {
    this._onDidChangeTreeData.fire(undefined)
  }
}
