import cors from 'cors'
import express from 'express'

const app = express()
app.use(express.json())
app.use(cors())

app.post('/chatToGPT', async (req, res) => {
  const { content } = req.body
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: content,
          },
        ],
        stream: true,
      }),
    }
  )

  // Mode Default
  // const data = await response.json()
  // res.send({
  //   message: data.choices[0].message,
  // })


  if (!response.body) return
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  // let isFinished = false
  // while (!isFinished) {
  //   const { done, value } = await reader.read()
  //   isFinished = done

  //   const decodedValue = decoder.decode(value)
  //   console.log(decodedValue)
  //   if (!decodedValue) break

  //   const messages = decodedValue.split('\n\n')

  //   const chuncks = messages
  //     .filter((msg) => msg && msg != 'data: [DONE]')
  //     .map((message) =>
  //       JSON.parse(message.replace(/^data:/g, '').trim())
  //     )

  //   for (const chunck of chuncks) {
  //     const content = chunck.choices[0].delta.content
  //     console.log(chunck.choices[0].delta.content)
  //     if (content) {
  //       res.write(content)
  //     }
  //   }
  // }
  // res.end()

  let isFinished = false
  while (!isFinished) {
    const { done, value } = await reader.read()
    isFinished = done

    if (done) {
      // If done, break the loop to avoid further processing
      break
    }

    const decodedValue = decoder.decode(value)

    if (!decodedValue) {
      // If no decoded value, break the loop
      break
    }

    console.log(decodedValue)

    // Split messages based on double newline
    const messages = decodedValue.split('\n\n')

    const chuncks = messages
      .filter((msg) => msg && msg !== 'data: [DONE]')
      .map((message) => {
        try {
          // Attempt to parse each message as JSON
          return JSON.parse(message.replace(/^data:/g, '').trim())
        } catch (error) {
          console.error('Error parsing JSON:', error)
          return null
        }
      })
      .filter((chunck) => chunck !== null)

    for (const chunck of chuncks) {
      const content = chunck.choices[0].delta.content
      console.log(content)
      if (content) {
        res.write(content)
      }
    }
  }

  res.end()
})

app.get('/', (req, res) => {
  return res.json(
    {
      name: 'TEST API OPENAI',
      message: 'Orangnya Pusing, Lagi Skripsian, Mohon Doanya agar Lancar'
    }
  )
})

app.listen(4000, () => {
  console.log('Server listening on port 4000')
})
