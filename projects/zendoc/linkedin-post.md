# Ever run into AI amnesia? What if you didn't have to?

I met someone randomly this past week who was working diligently on sensitive documents in a medical field and I was empathetic to the amount of legwork he had to do to keep track of revisions, local copies, security and on top of that going back and forth with an AI chat to help. It was painful to watch.

I suggested something to him and quickly realized the tools I'm used to as a coder were simply not available to someone non-technical.

What if you could work on a project but instead of starting one in ChatGPT you were *collaborating* with it in your own document, on your machine? What if it never forgot what you worked on last week, or last year? What if you wanted to switch to Claude but not have a whole separate conversation or copy/paste anything over?

This pretty much exists for software developers - to develop software. But those same principles should exist for writing, ideating, or just about anything else.

So I built something this weekend...

**[Zendoc](https://zendoc.org/)** is a writing environment that runs *inside* [Cursor](https://www.linkedin.com/preload/#) - I use Cursor all day, every day to write code. It's absolutely incredible. And while its AI also runs into context window limits (since it just leverages different AI models) it makes use of a file that can store permanent memory and rules, that it always referenced whenever you start a chat.

This just isn't available when you chat with ChatGPT or Gemini or Claude - at least not as strictly adhered to. Not to mention it's all sitting on the cloud - you have to upload everything to it and you can't take anywhere else without copy/pasting. With Zendoc everything sits on your local machine. That's a huge difference.

I manage a massive codebase of scripts by myself using Cursor.

And if scripts are basically complex documents, why not Cursor for managing thoughts, ideas and other written content?

Imagine writing all your blog, support articles, a novel,business proposal,research paper,or home project and there's an AI agent of choice beside you waiting for instructions like "start a new chapter" or "find every reference of x and change to y". All inside a tool that's wired to do things you can't imagine if you're not living and breathing software development all day.

The biggest challenge was how to bridge the gap of a technical tool for a non-technical user. I made it as simple as possible.

The UI is stripped down to the most basic writing environment - files, editor and an AI chat.

**To set it up:**

1. Download and install Cursor - free.
2. Install the Zendoc extension - free.
3. Create a GitHub account and a private repo where your revisions go - also free.

That's it.

**What you get:**

Your work auto-saves to GitHub - fully private, cloud backup with every revision you ever make to any file. And every file is in a simple markdown file format - easily portable and publishable to just about anywhere else.

The AI Agent that sits beside you is instructed to act like a librarian, not a coder. And you can switch between models to suit your task. Or switch it from "agent" to "ask" so it can't edit anything, and just provide feedback.

In every project you can say things like "add instruction: always remember to capitalize and bold the first sentence of every new file" and it will remember that. Forever.

This is also my first open source project, so if you're on the technical side feel free to [star or fork it](https://github.com/yostar/zendoc) - make it better. Please!

I hope you'll give it a try. Please share your experience/bugs/feedback here - I'll do my best to address.

*Fun fact: I conceptualized/built/configured/packaged Zendoc completely with AI, mostly inside Cursor - turning my workspace into the product that was packaging itself. It was very meta!*

→ [Zendoc for Cursor](https://yostar.github.io/zendoc/)

#writing #opensource #productivity #docs-as-code #cursor #technical-writing #ai #chatgpt