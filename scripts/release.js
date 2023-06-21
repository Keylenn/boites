const fs = require("node:fs")
const {resolve} = require("node:path")
const {red, lightGreen, blue, green, cyan} = require("kolorist")
const prompts = require("prompts")
const exec = require('exec-sh')
const elapsed = require('elapsed-time-logger')

const targetDir = resolve(__dirname, '../packages')

const dirs = fs.readdirSync(targetDir)

release()



async function release() {
  try {
    const {releaseDirs} = await prompts(
      [{
        type: 'multiselect',
        name: 'releaseDirs',
        message: '请选择需要打包📦的目录',
        choices: dirs.map(dir => ({
          title: dir,
          value: dir,
        })),
      }],
    )

    if(!releaseDirs || releaseDirs.length === 0) throw new Error(red('✖') + ' Release cancelled')


    const tasks = []

    while(releaseDirs.length) {
      const dir = releaseDirs.shift()
      const targetPath = resolve(targetDir, dir)
      const pkgPath = resolve(targetPath, './package.json')
      const pkg = require(pkgPath)
      console.log('📦' + lightGreen(pkg.name) + ':\n')

      const {version, tag} = await prompts([{
        type: 'text',
        name: 'version',
        message: '发布版本号🎯',
        initial: pkg.version || '1.0.0'
      }, {
        type: 'select',
        name: 'tag',
        message: '发布标签🏷️',
        choices: [
          { title: 'latest', value: 'latest', description: '最新版本eg: 1.0.0' },
          { title: 'beta', value: 'beta',  description: '测试版本eg: 1.0.0-beta.0' },
          { title: 'next', value: 'next',  description: '先行版本eg: 1.0.0-alpha.0' },
        ],
        initial: 1
      }])

      console.log(version, tag)
      if(version) {
        tasks.push(async () => {
          console.log(blue(`📦 ${pkg.name}@${version} 发布中...`))

          // 修正pkg
          if(!pkg.scripts) {
            pkg.scripts = {}
          }
          if(!pkg.scripts.build) {
            pkg.scripts.build = 'vite build'
          }
          if(!pkg.publishConfig) {
            pkg.publishConfig = {
              access: "public",
              registry: "https://registry.npmjs.org/"
            }
          }

          pkg.version = version
          fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

          // 构建&发布
          const sh = `cd ${targetPath} && pnpm i && pnpm build && npm publish ${tag ? `--tag ${tag}` : ''}`
          console.log('🤖' + cyan(sh))
          await exec.promise(sh)

          console.log(green(`✅ ${pkg.name}@${version} 发布完成！`))
        })
      }
    }

    elapsed.start('release')
    for (const task of tasks) {
      await task()
    }
    elapsed.end('release', lightGreen('✅ 所有包发布完成！'))
    

  } catch (error) {
    console.log(red('✖ Release error:'), error.message)
    return
  }
}


