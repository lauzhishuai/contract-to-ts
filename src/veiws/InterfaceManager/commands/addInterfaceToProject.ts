import { ProjectItem } from '../TreeItem/ProjectItem'
import { MOMInterface } from '../../../commands/addInterface'
import { window } from 'vscode'

export const addInterfaceToProject = async (target: ProjectItem) => {
  try {
    const momIntf = new MOMInterface({
      project: target.project,
    })
    await momIntf.pickService()
    await momIntf.pickVersion()
    await momIntf.pickMethod()
    await momIntf.genCodeFile()
  } catch (error) {
    window.showErrorMessage(error.message)
  }
}
