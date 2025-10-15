import path = require('path')
import {
  getProjectsInfo,
  pickProject,
  pickTypesFilesDir,
  writeTypeDirToPackageJson,
} from '../utils'
import { QuickPickItem, window } from 'vscode'

export const init = async () => {
  // 获取项目package信息
  const projects = await getProjectsInfo()
  console.log(projects)

  if (!projects.length) {
    window.showInformationMessage(
      '当前项目无初始所需信息，请检查package.json配置!'
    )
    return Promise.reject()
  }

  // step1.可能有package文件，选择项目
  const pickedProject = await pickProject(projects)

  // step2.选择生成目录
  const result = await pickTypesFilesDir(pickedProject)

  // step3.将选择的生成目录写进package.json
  if (result && result.typesFilesDir) {
    writeTypeDirToPackageJson(pickedProject, result.typesFilesDir)
  }
}
