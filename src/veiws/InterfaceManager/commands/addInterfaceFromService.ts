import { ServiceItem } from '../TreeItem/ServiceItem'
import { MOMInterface } from '../../../commands/addInterface'
import { window } from 'vscode'

export const addInterfaceFromService = async (target: ServiceItem) => {
  try {
    const project = target.getParent().project
    const service = target.service
    const momIntf = new MOMInterface({ project, service })
    await momIntf.pickVersion()
    await momIntf.pickMethod()
    await momIntf.genCodeFile()
  } catch (error) {
    window.showErrorMessage(error.message)
  }
}
