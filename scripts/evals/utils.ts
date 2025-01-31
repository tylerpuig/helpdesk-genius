import readline from 'readline'

export function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

export async function confirmContinue(
  rl: readline.Interface,
  expectedOutput: string[]
): Promise<boolean> {
  console.log('Expected output: ', expectedOutput)

  const answer = await new Promise<string>((resolve) => {
    rl.question('Continue to next test? (y/n): ', resolve)
  })

  return answer.toLowerCase() === 'y'
}
