import { Uri } from 'vscode'

/**
 * @description: 服务信息
 */
export type ServiceInfo = {
  id: number
  code: string
  name: string
  projectName: string
  operation: string
  requestModelId: number
  responseModelId: number
  projectId: number
  appId: string
  level: string
  status: string
  owner: string
  ownerName: string
  administrators: string
  comment: string
  createdTime: number
  packageName: null
  version: number
  sourceFrom: string
  updateBy: string
  createBy: string
  modifiesStatus: string
  interfaceId: number
  canModify: boolean
  originVersion: null
  contractType: string
  reqElement: string
  respElement: string
  methodType: number
  methodOrder: number
  filePath: string
  attributes: string
  descriptions: {
    ZH_CN: string
    EN_US: string
  }
}

/**
 * @description: 项目
 */
export interface ProjectItem {
  id: number
  appId: string
  name: string
  description: string
  owner: string
  organization: string
  version: number
  serviceCode: string
}

/**
 * @description: 项目版本
 */
export interface ProjectVersionItem {
  action: number
  comment: string
  contractType: string
  copyVersion: number
  createBy: string
  createTime: number
  historyId: number
  mixContractType: boolean
  projectId: number
  publishVersion: number
  status: 'PUBLISH' | 'IN_MODIFY'
  updateBy: string
  updateStatus: number
  updateTime: number
  version: number
}

/**
 * @description: 接口信息
 */
export type InterfaceInfoType = {
  csharpPackage: null | string
  csharpPackageName: null | string
  interfaceName: null | string
  javaPackage: null | string
  packageName: null | string
  serviceName: string
  serviceNamespace: string
}

/**
 * @description: 接口
 */
export interface InterfaceItem {
  id: number
  code: string
  name: string
  projectName: string
  operation: string
  requestModelId: number
  responseModelId: number
  projectId: number
  appId: string
  level: string
  status: string
  owner: string
  ownerName: string
  administrators: string
  comment: string
  createdTime: number
  packageName: string | null
  version: number
  sourceFrom: string
  updateBy: string
  createBy: string
  modifiesStatus: string
  interfaceId: number
  canModify: boolean
  originVersion: null | number | string
  contractType: string
  reqElement: string
  respElement: string
  methodType: number
  methodOrder: number
  filePath: string
  attributes: string
  descriptions: {
    ZH_CN: string
    EN_US: string
  }
}

/**************** 接口模型信息start ***************/
export interface InterfaceField {
  id: number
  name: string
  shortName: string
  metadata: string | null
  modelId: number | null
  required: boolean
  length: number
  repeated: number
  modifies: number
  range: string
  comment: string
  annotation: string | null
  order: number | null
  fieldType: string | null
  xmlWrapper: string | null
  xmlAlias: string | null
  projectId: number | null
  belongTo: number
  sourceFrom: string | null
  updateBy: string | null
  createBy: string | null
  modifiesStatus: string
  createdTime: number
  originVersion: number | null
  attributes: string | null
  fType: string | null
  enum: boolean
  generic: boolean
  descriptions: {
    ZH_CN: string
    EN_US: string
  }
}

export interface InterfaceSchema {
  id: number
  name: string
  namespace: string
  packageName: string
  modifies: number
  dotNetPackageName: string
  projectId: number
  version: number
  updateBy: string
  createBy: string
  sourceFrom: string
  modifiesStatus: string
  originVersion: string | null
}

export interface InterfaceModel {
  id: number
  name: string | null
  fullName: string | null
  extendId: number
  schemaId: number
  modifies: number
  comment: string
  packageName: string
  status: string | null
  point: number
  projectId: number
  version: number
  sourceFrom: string
  createBy: string
  updateBy: string
  modifiesStatus: string
  updateTime: number | null
  appId: number | null
  owner: string | null
  administrators: string | null
  projectName: string | null
  originVersion: number | string | null
  filePath: string
  annotation: string
  nsUri: string
  attributes: string
  modelType: number
  javaPackage: string
  csharpPackage: string
  modelAlias: string
  order: number
  descriptions: {
    ZH_CN: string
    EN_US: string
  }
  enum: boolean
  generic: boolean
}

export interface InterfaceEnumeration {
  id: number
  value: number
  name: string
  comment: string
  modelId: number
  projectId: number
  version: number
  sourceFrom: string
  updateBy: string
  createBy: string
  modifiesStatus: string
  originVersion: number
  createdTime: number | null
  descriptions: {
    ZH_CN: string
    EN_US: string
  }
  annotation: string
}

export interface InterfaceDetailInfo {
  field: InterfaceField
  schema: InterfaceSchema
  model: InterfaceModel
  enumerations: InterfaceEnumeration[]
  children: InterfaceDetailInfo[]
  services: any[]
  type: any
  modelId: string
  relationId: number | null
  hasUsed: boolean
  packageName: string | number
  useDependency: boolean
  extension: string | null
  replace: boolean
  request: boolean | null
  response: boolean | null
  notAllowToDep?: boolean
}
/**************** 接口模型信息end ***************/

export interface InterfaceMetaData {
  methodId: number
  methodName: string
  version: number
}

interface MOMConfig {
  typeFileDir: string
  generateOptions: {
    ignoredTypes: string[]
  }
}

export interface InitProject {
  name: string
  uri: Uri
  packageJson: any
  config: MOMConfig
  // typesFilesDir: Uri
  // configFileUri: Uri
}

export interface ServiceMetaData {
  appId: string
  projectId: number
  projectName: string
  serviceCode: string
}

export type InterfaceUpdateType = "newestVersion" | "chooseVersion";
