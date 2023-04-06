const { exec } = require('child_process')
const { REST, Routes } = require('discord.js')
const { clientId, guildIds, token } = require('./dist/config.json')
const fs = require('node:fs')
const path = require('node:path')

const commands = []
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'dist/commands')
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const command = require(`./dist/commands/${file}`)
  commands.push(command.data.toJSON())
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token)

// and deploy your commands!
;(() => {
  try {
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        throw error
      }
      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
      ;(async () => {
        console.log(
          `Started refreshing ${commands.length} application (/) commands.`
        )

        // The put method is used to fully refresh all commands in the guild with the current set

        const promises = []
        for (const guild of guildIds) {
          promises.push(
            rest.put(Routes.applicationGuildCommands(clientId, guild), {
              body: commands
            })
          )
        }

        // const data = await rest.put(
        //   Routes.applicationGuildCommands(clientId, guildId),
        //   { body: commands }
        // )

        // console.log(
        //   `Successfully reloaded ${data.length} application (/) commands.`
        // )

        const joinedGuilds = await Promise.allSettled(promises)

        for (const promiseResult of joinedGuilds) {
          if (promiseResult.status === 'fulfilled') {
            console.log(
              `Successfully reloaded ${promiseResult.value.length} application (/) commands.`
            )
          } else {
            console.error(promiseResult.reason)
          }
        }
      })()
    })
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error)
  }
})()
