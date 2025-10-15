/**
 * @description: mom平台接口服务
 */

import axios from 'axios'
import {
  InterfaceDetailInfo,
  InterfaceInfoType,
  InterfaceItem,
  ProjectItem,
  ProjectVersionItem,
  ServiceInfo,
} from '../index'
import { getConfig } from '../utils'
import { window } from 'vscode'

// 获取 accessToken 的函数
const getAccessToken = () => {
  return getConfig('contract-to-ts.accessToken') as string || ''
}

// 检查 accessToken 是否配置
const checkAccessToken = () => {
  const token = getAccessToken()
  if (!token) {
    window.showErrorMessage('请先配置 MOM 平台 accessToken！\n可以通过 VS Code 设置搜索 "contract-to-ts.accessToken" 进行配置。')
    return false
  }
  return true
}

// 创建带 accessToken 的 API 实例
const createAPIWithToken = (baseURL: string) => {
  return axios.create({
    headers: {
      ['access-token']: getAccessToken(),
    },
    baseURL,
  })
}

const MOM_PROJECT_API = createAPIWithToken('http://contract.mobile.flight.ctripcorp.com/api/osg/')
const MOM_WEB_API = axios.create({
  baseURL: 'http://contract.mobile.flight.ctripcorp.com/api/v2/',
})
const MOM_WEB_REST_API = axios.create({
  baseURL: 'http://contract.mobile.flight.ctripcorp.com/restapi/',
})

// 获取服务信息
export const getServiceInfo = async ({
  projectId,
  version,
  methodName,
}): Promise<ServiceInfo> => {
  const params = {
    projectId,
    version,
    methodName,
    head: { locate: 'zh-CN' },
  }
  const ret = await MOM_WEB_REST_API.post('/method/getTarget', params)
  return ret.data.result
}

// mom平台获取所有项目列表
export const getProjectList = async (
  keywords: string
): Promise<ProjectItem[]> => {
  if (!checkAccessToken()) {
    return []
  }
  const ret = await MOM_PROJECT_API.post('project', { term: keywords })
  const { body } = ret.data || {}
  return body || []
}

// 获取项目版本列表
export const getProjectVersionList = async (
  projectId: number
): Promise<ProjectVersionItem[]> => {
  const ret = await MOM_WEB_API.get(`project/versions/${projectId}`)
  const versionList = ret.data || []
  return versionList
}

// 获取接口列表
export const getInterfaceList = async ({
  projectId,
  version,
}: {
  projectId: number
  version: number
}): Promise<{
  interfaceInfo: InterfaceInfoType
  interfaceList: InterfaceItem[]
}> => {
  if (!checkAccessToken()) {
    return {
      interfaceInfo: {} as InterfaceInfoType,
      interfaceList: [],
    }
  }
  const params = {
    projectId: projectId,
    version: version,
    head: {
      locate: 'zh-CN',
    },
  }
  const ret = await MOM_WEB_REST_API.post('project/getBinds', params)
  return {
    interfaceInfo: ret.data?.result?.interfaceInfo, // 接口信息，用于接口管理
    interfaceList: ret.data?.result?.services || [],
  }
}

// 获取接口模型，生成接口TS
export const getInterfaceModels = async (
  methodId: number,
  methodName: string
): Promise<InterfaceDetailInfo> => {
  if (!checkAccessToken()) {
    return {} as InterfaceDetailInfo
  }
  const params = {
    methodId,
    head: { locate: 'zh-CN' },
  }

  const ret = await MOM_WEB_REST_API.post('method/tree', params)

  return ret.data?.result
}
