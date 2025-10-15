import { TreeItem } from 'vscode'
import { workspace } from 'vscode'
import { InterfaceItem } from '../TreeItem/InterfaceItem'
import { InterfaceUpdateType } from '../../../index'
import { MOMInterface } from '../../../commands/addInterface'

export const updateInterface = async (intf: InterfaceItem) => {
  const project = intf.getProjectCategory().project
  const service = intf.getServiceCategory().service
  const method = intf.method
  const updateType = workspace
    .getConfiguration('zt-mom-ts')
    .get<InterfaceUpdateType>('directUpateType')
  const userPick = updateType === 'chooseVersion'
  const momIntf = new MOMInterface({ project, service, method })
  await momIntf.update(userPick)
  await momIntf.genCodeFile()
}
