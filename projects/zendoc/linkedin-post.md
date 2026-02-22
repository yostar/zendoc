# LinkedIn Post: Zendoc Launch

---

I met someone this past week who was working diligently on sensitive documents in a medical field and I was empathetic to the amount of legwork he had to do to keep track of revisions, local copies, security and on top of that going back and forth with an AI chat to help. It was a tangled mess.

I suggested something to him and quickly realized the tools I'm used to were simply not available to someone non-technical.

Software development has an entire ecosystem of packages and plugins-one command installs anything, and everything builds on what others have made. But when I sit down to write a note, a document, or even this post, none of that sophistication exists. All the tools are proprietary - Microsoft Word, Google Docs, Notion, Evernote... AI is being baked in - but if you're not a software developer using tools like @Cursor, you just don't know.

So I built something this weekend...

I'm bringing the **Docs-as-Code** workflow to the non-technical writer. Why should devs have all the fun?

**Zendoc** is a writing environment that runs *inside* **Cursor** - I use Cursor all day, every day to write code. It's absolutely incredible. And while it also suffers from context window limits (since it just leverages different AI models with their own limits) it uses a file that can store permanent memory and rules, that it always uses whenever you start a chat. For some reason this concept just isn't available when you chat with ChatGPT or Gemini or Claude - at least not as strictly adhered to. And that's all sitting on the cloud - you have to upload everything to it. This sits on your local machine. That's a huge difference.

I manage/add/edit hundreds of thousands of lines of complex code all by myself using Cursor.

And code is basically just complex documents.  

So why not Cursor for just managing your thoughts, ideas and other written content?

Imagine writing all your blog content, your support articles, your next novel, and there's an AI agent of choice sitting beside you waiting for you to say things like "start a new chapter" or "find every reference of x and change to y" or ... you know... just about anything. All inside a tool that's wired to do things you can't even imagine if you're not living and breathing software all day.

The biggest challenge was how to bridge the gap of a technical tool for a non-technical user. I made it as simple as possible.

The UI is stripped down to the most basic. Writing environment - files, editor and an AI chat.

**To set it up:**

1. Download and install Cursor - free.
2. Install the Zendoc extension - free.
3. Create a GitHub account and the repo where your backups/revisions go.

That's it.

**What you get:**

Your work auto-saves to GitHub - fully private, cloud backup with every revision you ever make to any file.  And every file is in a simple `markdown` file format (that you don't have to worry about when editing) but that means it's in the most universally supported format - like HTML for documents. Easily portable and publishable to just about anywhere or anything.

The AI Agent that sits beside you is instructed to act like a librarian, not a coder. 

And in every project you can say things like "add instruction: always remember to capitalize and bold the first sentence of every new file" and it will remember that. Forever.

This is also my first open source project, so if you're on the technical side feel free to [star or fork it](https://github.com/yostar/zendoc) - make it better. Please!

I hope you'll give it a try! Please share your experience/bugs/feedback here - I'll do my best to address.

*Fun fact: I conceptualized/built/configured/packaged Zendoc completely with AI, mostly inside Cursor - turning my workspace into the product that was packaging itself. It was very meta. My head hurts.*

→ [Zendoc for Cursor](https://yostar.github.io/zendoc/)

#writing #opensource #productivity #docs-as-code #cursor