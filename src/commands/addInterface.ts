/* eslint-disable @typescript-eslint/naming-convention */
import path = require('path')
import { QuickPickItem, Uri, window, workspace } from 'vscode'
import { InterfaceDetailInfo } from '..'
import { getProjectsInfo, isFileExist } from '../utils'
import { throttle } from 'lodash'
import {
  getInterfaceList,
  getInterfaceModels,
  getProjectList,
  getProjectVersionList,
  getServiceInfo,
} from '../service'
import { GeneratorFactory } from '../Generator/GeneratorFactory'
import { InterfaceMetaData, InitProject, ServiceMetaData } from '../index'

import { InterfaceManager } from '../veiws/InterfaceManager'

const VERSION_STATUS = {
  IN_MODIFY: '可编辑',
  PUBLISH: '已发布',
}

interface MOMInterfaceConstructorParams {
  project?: InitProject
  service?: ServiceMetaData
  models?: InterfaceDetailInfo
  version?: number
  method?: InterfaceMetaData
}

export class MOMInterface {
  private project = null
  private service: ServiceMetaData = null
  private models: InterfaceDetailInfo
  private version: number
  private method: InterfaceMetaData
  private typeFileDir: Uri // 要生成文件的目录
  private isNewCreate: boolean = false
  constructor({
    project = null,
    service = null,
    models = null,
    version = undefined,
    method = null,
  } = {}) {
    if (project) {
      this.project = project
    }
    if (service) {
      this.service = service
    }
    if (models) {
      this.models = models
    }
    if (version) {
      this.version = version
    }
    if (method) {
      this.method = method
    }
  }

  private async getVersion(select: boolean = true) {
    const versions = await getProjectVersionList(this.service.projectId)
    if (versions.length <= 0) {
      window.showErrorMessage('未查询到版本号信息')
      return
    }
    // 只有一个结果 默认选中
    if (versions.length === 1) {
      this.version = versions[0].version
      return
    }

    if (select) {
      const value = await window.showQuickPick(
        versions.map((v) => ({
          label: v.version.toString(),
          description: VERSION_STATUS[v.status],
          __version: v,
        })),
        {
          ignoreFocusOut: true,
          title: '请选择契约版本',
        }
      )
      if (value) {
        this.version = value?.__version.version
      }
      return
    }
    // 没有开启用户选择 默认选中最新的版本
    this.version = versions[0].version
  }

  async update(userPick: boolean = false) {
    if (!this.method) {
      window.showErrorMessage('Please pick a method first.')
      return
    }
    await this.getVersion(userPick)
    const { interfaceList } = await getInterfaceList({
      projectId: this.service.projectId,
      version: this.version,
    })
    const targetMethod = interfaceList.find(
      (i) => i.name === this.method.methodName
    )
    if (!targetMethod) {
      window.showErrorMessage('Method not found.')
      return
    }
    this.method = {
      methodId: targetMethod.id,
      methodName: targetMethod.name,
      version: targetMethod.version,
    }
  }

  async createNewFilePath(uri: Uri) {
    this.isNewCreate = true
    await workspace.fs.createDirectory(uri)
    await workspace.fs.writeFile(
      Uri.joinPath(uri, 'index.ts'),
      new Uint8Array()
    )
    await workspace.fs.writeFile(
      Uri.joinPath(uri, 'interfaceInfo.json'),
      new Uint8Array()
    )
  }

  // step1:选择项目,生成项目信息
  async pickProject() {
    // 获取配置信息（mom.config.json）
    const projects = (await getProjectsInfo()).filter((p) => !!p.config) || []
    if (projects.length === 0) {
      window.showErrorMessage(
        '未配置contractToTSConfig,请在package文件中配置contractToTSConfig!'
      )
      return
    }

    // 只有一个项目 直接选中
    if (projects.length === 1) {
      this.project = projects[0]
      return
    }

    // 多个项目 选择项目
    const pickValue = await window.showQuickPick(
      projects.map((p) => ({
        label: p.name,
        detail: p.uri.path,
        project: p,
      })),
      {
        title: '请选择添加接口的项目',
        ignoreFocusOut: true,
      }
    )
    if (pickValue) {
      this.project = pickValue?.project
    }
  }

  // step2:选择服务
  pickService() {
    if (!this.project) {
      return
    }
    return new Promise((resolve) => {
      const serviceQuickPick = window.createQuickPick<
        QuickPickItem & { service: ServiceMetaData }
      >()
      serviceQuickPick.title = '请输入项目名称、appId或serviceCode'
      serviceQuickPick.matchOnDescription = true
      serviceQuickPick.ignoreFocusOut = true

      serviceQuickPick.onDidChangeValue(
        throttle(async (input) => {
          const services = await getProjectList(input)
          serviceQuickPick.items = services.map((service) => ({
            label: `${service.serviceCode ? service.serviceCode + '-' : ''}${
              service.name
            }`,
            description: service.appId,
            detail: service.description,
            service: {
              appId: service.appId,
              projectId: service.id,
              projectName: service.name,
              serviceCode: service.serviceCode,
            },
          }))
        }, 500)
      )

      serviceQuickPick.onDidChangeSelection((selects) => {
        if (!!selects?.[0]) {
          this.service = selects[0].service
          resolve(true)
          serviceQuickPick.dispose()
        }
      })

      serviceQuickPick.show()
    })
  }

  // step3:选择契约版本
  async pickVersion() {
    if (!this.service) {
      window.showErrorMessage('请先选择项目信息!')
      return
    }
    await this.getVersion(true)
  }

  // step4:选择接口
  async pickMethod() {
    if (!this.version) {
      window.showErrorMessage('请先选择版本信息!')
      return
    }
    const projectId = this.service.projectId
    const version = this.version
    const { interfaceList } = await getInterfaceList({ projectId, version })
    const method = await window.showQuickPick(
      interfaceList.map((i) => ({
        label: i.name,
        description: i.operation,
        detail: i.descriptions.ZH_CN,
        __method: {
          methodId: i.id,
          methodName: i.name,
          version: i.version,
        },
      })),
      {
        ignoreFocusOut: true,
        title: '请选择要添加的接口',
      }
    )
    if (method) {
      this.method = method.__method
    }
    await this.getModels()
  }

  // step5:获取接口模型
  async getModels() {
    if (!this.method) {
      return
    }

    const methodId = this.method.methodId
    const methodName = this.method.methodName
    const models = await getInterfaceModels(methodId, methodName)
    this.models = models
  }

  // 生成文件目录
  async genFilePath() {
    if (!this.project || !this.project.config || !this.method) {
      return
    }
    // 要生成文件的目录
    const typesDirUri = Uri.joinPath(
      this.project.uri,
      this.project.config.typeFileDir
    )

    if (!(await isFileExist(typesDirUri))) {
      const methodFileUri = Uri.joinPath(typesDirUri, this.method.methodName)
      await workspace.fs.createDirectory(typesDirUri)
      await this.createNewFilePath(methodFileUri)
      this.typeFileDir = methodFileUri
      return
    }

    // 目录中存在 serviceCode+methodName 的目录 则使用该目录
    if (await isFileExist(Uri.joinPath(typesDirUri, this.method.methodName))) {
      this.typeFileDir = Uri.joinPath(typesDirUri, this.method.methodName)
      return
    }

    // 如果只是 methodName 相同 则需进一步校验 serviceCode 是否相同
    // if (await isFileExist(Uri.joinPath(typesRootUri, this.method.methodName))) {
    //   const isMethodInfoFileExist = await isFileExist(
    //     Uri.joinPath(typesRootUri, this.method.methodName, 'interfaceInfo.json')
    //   )
    //   if (isMethodInfoFileExist) {
    //     const interfaceInfo = JSON.parse(
    //       (
    //         await workspace.fs.readFile(
    //           Uri.joinPath(
    //             typesRootUri,
    //             this.method.methodName,
    //             'interfaceInfo.json'
    //           )
    //         )
    //       ).toString()
    //     )
    //     if (interfaceInfo.serviceCode === this.service.serviceCode) {
    //       this.typeFileDir = Uri.joinPath(typesRootUri, this.method.methodName)
    //       return
    //     }
    //     const methodFilePath = Uri.joinPath(
    //       typesRootUri,
    //       `${this.service.serviceCode}${this.method.methodName}`
    //     )
    //     await this.createNewFilePath(methodFilePath)
    //     this.typeFileDir = methodFilePath
    //   }
    // }

    // 以上两种情况都不存在 直接创建新的目录
    const methodFilePath = Uri.joinPath(typesDirUri, this.method.methodName)
    await this.createNewFilePath(methodFilePath)
    this.typeFileDir = methodFilePath
  }

  // 生成接口文件
  async genCodeFile() {
    if (!this.project || !this.service || !this.method || !this.models) {
      return
    }
    // 是否已有类型文件
    if (!this.typeFileDir) {
      await this.genFilePath()
    }

    try {
      const generateOptions = this.project.config.generateOptions
      const serviceInfo = await getServiceInfo({
        projectId: this.service.projectId,
        version: this.version,
        methodName: this.method.methodName,
      })
      // 生成类型文件内容
      const code = GeneratorFactory.generate(
        {
          lang: 'ts',
          service_info: serviceInfo,
          version: this.version,
          root: this.models,
        },
        {},
        generateOptions
      )
      const interfaceInfo: ServiceMetaData & InterfaceMetaData = {
        appId: this.service.appId,
        projectId: this.service.projectId,
        projectName: this.service.projectName,
        version: this.version,
        methodName: this.method.methodName,
        serviceCode: this.service.serviceCode,
        methodId: this.method.methodId,
      }
      await workspace.fs.writeFile(
        Uri.joinPath(this.typeFileDir, 'index.ts'),
        Buffer.from(code)
      )
      await workspace.fs.writeFile(
        Uri.joinPath(this.typeFileDir, 'interfaceInfo.json'),
        Buffer.from(JSON.stringify(interfaceInfo, null, 2))
      )
    } catch (error) {
      window.showErrorMessage(`文件生成错误: ${error.message}`)
    }
  }

  // 销毁方法
  dispose() {
    if (this.isNewCreate) {
      workspace.fs.delete(this.typeFileDir, { recursive: true })
    }
    this.project = null
    this.service = null
    this.models = null
    this.version = null
    this.method = null
    this.typeFileDir = null
  }
}

export const addInterface = async () => {
  const momInterface = new MOMInterface()
  await momInterface.pickProject()
  await momInterface.pickService()
  await momInterface.pickVersion()
  await momInterface.pickMethod()
  await momInterface.genCodeFile()
}
