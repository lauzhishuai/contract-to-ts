import { Uri, workspace, window, QuickPickItem, commands } from 'vscode'

export const isFileExist = async (uri: Uri) => {
  try {
    await workspace.fs.stat(uri)
    return true
  } catch (error) {
    return false
  }
}

/*
获取项目信息
@param uri 项目package.json文件的uri
@returns 项目信息（mom.cinfig.json & package.json 信息）
*/

const getProjectInfo = async (uri: Uri) => {
  let packageJson
  let projectName
  let configFileUri
  let config
  try {
    // 读取并解析package.json文件内容
    const pkg = JSON.parse((await workspace.fs.readFile(uri)).toString())
    const { name, contractToTSConfig } = pkg || {}
    config = contractToTSConfig
    // // 获取mom配置文件路径
    // const momConfigFilePath = Uri.joinPath(uri, '..', 'mom.config.json')
    // // 检查mom.config.json文件是否存在
    // const isExistMomConfigFile = await isFileExist(momConfigFilePath)

    // // mom.config.json 中配置要放置类型文件的目录
    // if (isExistMomConfigFile) {
    //   config = JSON.parse(
    //     (await workspace.fs.readFile(momConfigFilePath)).toString()
    //   )
    // }

    // 设置配置文件路径
    // configFileUri = isExistMomConfigFile ? momConfigFilePath : null
    // configFileUri =

    // 设置项目名称
    projectName = name
    // 保存package.json内容
    packageJson = pkg
  } catch (error) {
    window.showWarningMessage(`Error reading package.json at ${uri.path}`)
  } finally {
    return {
      name: projectName,
      uri: Uri.joinPath(uri, '..'),
      packageJson,
      config,
      // configFileUri,
    }
  }
}

/**
 * @description: 获取项目信息
 */
export const getProjectsInfo = async () => {
  const excludePatterns = '**/{node_modules,dist,publish}/**'
  // 查找工作区中的package.json文件
  const projectPaths = await workspace.findFiles(
    '**/package.json',
    excludePatterns
  )
  // 获取项目信息（mom.config.json & package.json 信息）
  const projects = await Promise.all(projectPaths.map(getProjectInfo))
  return projects
}

/**
 * @description: 选择项目
 */
export const pickProject = (projects) => {
  const formatProjects: QuickPickItem[] = (projects || []).map((item) => ({
    ...item,
    label: item.name,
    detail: item.uri.fsPath,
  }))
  return window.showQuickPick(formatProjects, {
    title: '请选择项目',
    placeHolder: '请选择对接的契约项目',
  })
}

/**
 * @description: 选择类型文件保存目录
 */
export const pickTypesFilesDir = async (project) => {
  const { uri } = project // 项目package.json所在目录
  const packageJsonUri = Uri.joinPath(uri, 'package.json')
  const packageJsonContent = await workspace.fs.readFile(packageJsonUri)
  const packageJson = JSON.parse(packageJsonContent.toString())

  // 检查是否已存在 contractToTSConfig 配置
  if (
    packageJson.contractToTSConfig &&
    packageJson.contractToTSConfig.typeFileDir
  ) {
    window.showWarningMessage('已初始化，请点击添加接口契约')
    return false
  }
  return window
    .showOpenDialog({
      defaultUri: uri,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: '选择类型文件保存目录',
      canSelectMany: false,
    })
    .then((dir) => {
      const path = dir?.[0].fsPath
      if (!path) {
        return Promise.reject(new Error('设置错误，请重新选择!'))
      }
      if (!path.includes(uri.fsPath)) {
        return Promise.reject(new Error('请选择当前项目下的目录'))
      }
      return Promise.resolve({
        typesFilesDir: path.replace(uri.fsPath, '.'),
      })
    })
}

/**
 * @description: 将选择的生成目录写进package.json
 */
export const writeTypeDirToPackageJson = async (project, typeDir: string) => {
  try {
    const { uri } = project || {}
    const packageJsonUri = Uri.joinPath(uri, 'package.json')
    // 读取现有的 package.json 文件
    const packageJsonContent = await workspace.fs.readFile(packageJsonUri)
    const packageJson = JSON.parse(packageJsonContent.toString())

    // 添加或更新 contractToTSConfig 配置
    packageJson.contractToTSConfig = {
      typeFileDir: typeDir,
    }

    // 将更新后的内容写回文件
    const updatedContent = JSON.stringify(packageJson, null, 2)
    setContextValue('typeFileDir', typeDir)
    return workspace.fs.writeFile(
      packageJsonUri,
      Buffer.from(updatedContent, 'utf-8')
    )
  } catch (error) {
    console.error('写入 package.json 配置失败:', error)
    return { success: false }
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Global = new Map()
Global.set('isExpandAll', true)

/**
 * @description: 获取插件配置
 */
export const getConfig = (configKey) => {
  return workspace.getConfiguration('').get(configKey)
}

export const getContextValue = (ctxKey) => {
  return Global.get(ctxKey)
}

export const setContextValue = (ctxKey, value) => {
  return commands.executeCommand('setContext', ctxKey, value).then(() => {
    Global.set(ctxKey, value)
  })
}
