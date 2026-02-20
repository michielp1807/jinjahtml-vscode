const vscode = require('vscode')
const { resolve, dirname } = require('path')

let cache = {}

const PATH_RE = new RegExp(/(?:\'|\")([\w/\-]+\.[\w]+)(?:\'|\")/)
const RELATIVE_PATH_RE = new RegExp(/(?:\'|\")((?:(?:\.\/|(?:\.\.\/)+))[\w/\-]+\.[\w]+)(?:\'|\")/)

const START_OF_FILE = new vscode.Position(0, 0)

/**
 * 
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @param {vscode.CancellationToken} token 
 * @returns {Promise<vscode.Uri | null>}
 */
async function getTemplate(document, position, token) {
  let line = document.lineAt(position.line).text

  let match = line.match(PATH_RE)
  let relative_match = line.match(RELATIVE_PATH_RE)

  let path
  let search
  if (relative_match) {
    path = relative_match[1]
    search = vscode.workspace.asRelativePath(resolve(dirname(document.uri.path), path))
  } else if (match) {
    path = match[1]
    search = `**/{templates,jinja2}/${path}`
  } else {
    return null
  }

  // return null when outside of path string
  if (position.character <= line.indexOf(path) || position.character >= line.indexOf(path) + path.length) {
    return null
  }

  // get uri from cache
  if (search in cache) {
    return cache[search]
  }

  // find file in workspace
  const results = await vscode.workspace.findFiles(search, '', 1, token)
  if (results.length == 0) {
    return null
  }

  cache[search] = results[0]
  return results[0]
}

/**
 * @implements {vscode.DefinitionProvider}
 */
class TemplatePathProvider {
  provideDefinition(document, position, token) {
    if (!document.languageId.startsWith('jinja')) {
      return null;
    }

    return getTemplate(document, position, token).then(template => {
      if (!template) return null

      return new vscode.Location(template, START_OF_FILE)
    })
  }
}

module.exports = {
  TemplatePathProvider,
}
