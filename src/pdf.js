const { getDocument } = require('pdfjs-dist');

const PARTIAL_TEXT_EXPR = /((i\.e\.|e\.g\.|etc\.|et al\.|\b\d\.|\.{2,})|[^\.])$/

/**
 * Read a PDF file.
 * ```js
 *  const reader = read("path_or_URL/to/pdf", 2)
 *  for await (const batch of reader) {
 *    console.log(batch);
 *  }
 * ```
 * ```bash
 *  [
 *    { id: '1a', atPage: 1, text: '...' },
 *    { id: '1b', atPage: 1, text: '...' }
 *  ],
 *  ...
 * ```
 * 
 * @param  {string | URL} src  - Source of the PDF.
 * @param  {number} batchSize  - Size of the element batch to yielded at once.
 */
async function* read(src, batchSize = 1) {
  try {
    const instance = await getDocument(src).promise

    const pageCount = instance.numPages
    batchSize = Math.min(pageCount, Math.max(batchSize, 1))
    
    let idx, lastElementId;
    let [ text, elements ] = [ "", [{ id: '', atPage: 0, text: '' }] ]
    
    const pushElement = (_text, _pageNum) => {
      elements.push({
        id: lastElementId ?? `${_pageNum}${String.fromCharCode(96 + idx)}`,
        atPage: _pageNum,
        text: _text
      })
      text = ""
    }
    
    elements = []
    for (let n = 1; n <= pageCount; n++) {
      let page = await instance.getPage(n)
      let component = await page.getTextContent()
      
      if (text) {
        lastElementId = `${n-1}${String.fromCharCode(96 + idx)}`
        pushElement(text, n-1)
      } 
      
      idx = 1
      for (let item of component.items) {
        let content = item.str || "\n"
        
        if (content.search(PARTIAL_TEXT_EXPR) !== -1 || content.trim() === "") {
          text = text.concat(content)
        } else {
          pushElement(text.concat(content.trimStart()), n)
          if (!lastElementId) idx += 1
          lastElementId = null
        }

        if (elements.length >= batchSize) {
          yield elements.slice(0, batchSize)
          elements = elements.slice(batchSize, elements.length)
        }
      }
    }
    if (elements.length) yield elements
  } catch (error) {
    throw new Error(`Unable to load pdf from '${src}'`)
  }
}

module.exports = {
  read
}