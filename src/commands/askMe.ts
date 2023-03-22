import { SlashCommandBuilder } from 'discord.js'
import { openapi_token } from '../config.json'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: openapi_token
})
const openai = new OpenAIApi(configuration)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Jarvis a question')
    .addStringOption((option) => {
      return option
        .setName('question')
        .setDescription('The question you want to ask Jarvis')
        .setRequired(true)
    })
    .addBooleanOption((option) => {
      return option
        .setName('thread')
        .setDescription('Create a thread')
        .setRequired(false)
    })
    .addStringOption((option) => {
      return option
        .setName('persona')
        .setDescription('The personality of Jarvis')
        .addChoices(
          { name: 'Jarvis', value: 'jarvis' },
          { name: "Explain Like I'm Five", value: 'eli5' },
          { name: 'Redneck American', value: 'redneck' }
        )
        .setRequired(false)
    }),
  async execute(interaction: {
    deferReply: () => any
    options: {
      getString: (arg0: string) => string
      getBoolean: (arg0: string) => any
    }
    editReply: (arg0: string) => any
    channel: {
      threads: {
        create: (arg0: {
          name: string
          autoArchiveDuration: number
          type: string
          reason: string
          startMessage: any
        }) => any
      }
    }
    user: { username: any }
  }) {
    // console.log('interaction', interaction)
    console.time('Ask finished with')
    await interaction.deferReply()

    const question = interaction.options.getString('question')

    let persona = 'none'
    if (interaction.options.getString('persona')) {
      persona = interaction.options.getString('persona')
    }

    let creatThread: boolean
    if (interaction.options.getBoolean('thread')) {
      creatThread = true
    }

    // await interaction.editReply('Hmmm... let me think about that...')

    const personas: Record<string, any> = {
      none: '',
      eli5: `You are explaining questions to a five year old, and need to make your answer as simple as possible.
      I am a five year old child. And I don't understand complex words or sentences. This is my question: `,
      jarvis: `You are Jarvis, a personal assistant. You are a computer program that can answer any question
      with great accuracy. Your answers will be longer, and more in detail. If there are steps involved in the explanation you will dissect
      each step with detail description of them. Your aim is to educate the user at a university level of understanding. This is my question: `,
      redneck: `You are Darryl a redneck american, and talk like you are from the south. Your grammar is really bad will write as
      if you had a accent. Your are less polite. This is my question: `
    }

    const signOff: Record<string, string> = {
      none: '',
      eli5: `\n \n Ƥ É Ƭ É Γ`,
      jarvis: '\n \n - Jarvis',
      redneck: '\n \n - Darryl'
    }

    const signOffPrompt = signOff[persona]
    const personaPrompt = personas[persona]

    console.log({
      personaPrompt,
      signOffPrompt
    })

    // await interaction.editReply('Yes please')
    console.time('OpenAI API call')

    const prompt = personaPrompt + question
    console.log('prompt', prompt)

    const openAiRequest = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 2000
    })

    let completion: Record<string, any> = openAiRequest.data

    try {
    } catch (error: any) {
      console.log('[ERROR]: OpenAI API call failed.')
      if (error.response) {
        console.log('response: ', error.response)
      } else {
        console.error(error)
      }
      await interaction.editReply('Something went wrong')
    }

    /**
     * If the thread option is true, create a new thread to continue the conversation if the user who asked the question replies
     * in the same thread.
     */
    // if (createThread) {
    //   await interaction.channel.threads.create({
    //     name: `Jarvis - ${interaction.user.username}`,
    //     autoArchiveDuration: 60,
    //     type: 'GUILD_PRIVATE_THREAD',
    //     reason: 'Jarvis conversation',
    //     startMessage: interaction
    //   })

    //   console.timeLog('Ask finished with', { question, persona, createThread })
    //   return
    // }

    await interaction.editReply(`
    Your Question: ${question}${completion.choices[0].text}${signOffPrompt}
    `)

    console.timeLog('Ask finished with', { question })
    console.log(
      '_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ '
    )
  }
}
