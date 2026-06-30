#!/usr/bin/env python3
"""Add 100 AI Developer Tools to markbooki-8f13eaad. Category: AI Developer Tools."""
import json, os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(BASE, "public")

TOOLS = [
    # FREE 25
    {"n":"Continue","p":"Free","c":"AI Developer Tools","u":"https://continue.dev","d":"Free · Open-source AI code assistant for VS Code and JetBrains · Connect to any LLM including GPT-4, Claude, and local models · Inline chat, autocomplete, and codebase context · Highly customizable and extensible"},
    {"n":"Cline","p":"Free","c":"AI Developer Tools","u":"https://cline.bot","d":"Free · Autonomous AI coding agent for VS Code · Creates files, runs commands, and edits code autonomously · Supports Claude, GPT-4, and other LLMs · Terminal integration with real-time feedback"},
    {"n":"Aider","p":"Free","c":"AI Developer Tools","u":"https://aider.chat","d":"Free · AI pair programming in your terminal · Works with Git repositories to make and commit code changes · Supports GPT-4, Claude, and local models · Command-line interface for developers"},
    {"n":"TabbyML","p":"Free","c":"AI Developer Tools","u":"https://tabbyml.com","d":"Free · Self-hosted AI coding assistant for privacy-first teams · Supports code completion, chat, and codebase awareness · Run on your own hardware with no data leaks · Open source"},
    {"n":"OpenHands","p":"Free","c":"AI Developer Tools","u":"https://openhands.dev","d":"Free · AI software engineer that resolves GitHub issues autonomously · Open source platform for AI coding agents · Executes code, manages files, and runs tests · Formerly OpenDevin"},
    {"n":"GPT Engineer","p":"Free","c":"AI Developer Tools","u":"https://gptengineer.app","d":"Free · Specify what you want in plain English and get a working codebase · Generates entire projects from prompts · Iterative refinement through conversation · Open source"},
    {"n":"Open Interpreter","p":"Free","c":"AI Developer Tools","u":"https://www.openinterpreter.com","d":"Free · AI tool that lets LLMs run code locally on your computer · Execute Python, JavaScript, Shell, and more · Natural language to code execution · Supports GPT-4, Claude, local models"},
    {"n":"Devika AI","p":"Free","c":"AI Developer Tools","u":"https://github.com/stitionai/devika","d":"Free · Open-source AI software engineer · Autonomous coding, debugging, and deployment · Uses GPT-4 for reasoning and planning · Alternative to Devin for open source"},
    {"n":"FauxPilot","p":"Free","c":"AI Developer Tools","u":"https://github.com/fauxpilot/fauxpilot","d":"Free · Open-source alternative to GitHub Copilot · Self-hosted for complete privacy · Uses Codegen model for code generation · Compatible with VS Code and JetBrains"},
    {"n":"Plandex","p":"Free","c":"AI Developer Tools","u":"https://plandex.ai","d":"Free · Open-source AI coding agent for complex tasks · Handles large codebases with multi-step planning · Terminal-based with version control integration · Tracks context across sessions"},
    {"n":"Goose","p":"Free","c":"AI Developer Tools","u":"https://block.github.io/goose","d":"Free · Open-source AI developer agent by Block · Autonomous coding and toolkit usage · Extensible with custom extensions · Runs locally with multiple LLM support"},
    {"n":"Bolt.diy","p":"Free","c":"AI Developer Tools","u":"https://boltdiy.dev","d":"Free · Self-hosted AI coding platform · Generate full-stack web applications from prompts · Open source alternative to Bolt.new · Supports multiple LLM providers"},
    {"n":"Smol Developer","p":"Free","c":"AI Developer Tools","u":"https://github.com/smol-ai/developer","d":"Free · Lightweight AI coding agent that creates small applications · Open source with minimal dependencies · Generates clean, working code · Perfect for quick prototypes"},
    {"n":"OpenCode","p":"Free","c":"AI Developer Tools","u":"https://opencode.ai","d":"Free · Terminal-based AI coding agent · Autonomous code editing and file management · Supports multiple AI providers · Open source with extensible architecture"},
    {"n":"PearAI","p":"Free","c":"AI Developer Tools","u":"https://trypear.ai","d":"Free · Open-source AI code editor forked from VS Code · Built-in AI chat and code generation · Supports multiple LLM providers · Privacy-focused with local model support"},
    {"n":"Void Editor","p":"Free","c":"AI Developer Tools","u":"https://voideditor.com","d":"Free · AI-native code editor built from the ground up · Open source and extensible · Deep AI understanding of your entire codebase · Modern interface with intelligent assistance"},
    {"n":"Zed AI","p":"Free","c":"AI Developer Tools","u":"https://zed.dev","d":"Free · High-performance AI code editor built in Rust · Collaborative editing in real-time · AI-powered code completion and chat · Blazing fast startup and file operations"},
    {"n":"Kilo Code","p":"Free","c":"AI Developer Tools","u":"https://kilocode.ai","d":"Free · AI coding assistant with intelligent code completion · Multi-language support with context awareness · Fast and lightweight IDE integration · Write, debug, and refactor code"},
    {"n":"CodeGeeX","p":"Free","c":"AI Developer Tools","u":"https://codegeex.cn","d":"Free · AI-powered code generation and completion · Supports 100+ programming languages · Integrated with VS Code, IntelliJ, and more · Bilingual English and Chinese support"},
    {"n":"Melty","p":"Free","c":"AI Developer Tools","u":"https://melty.sh","d":"Free · AI coding assistant that understands your entire codebase · Open source with CLI and IDE integrations · Smart code search and navigation · Context-aware suggestions across files"},
    {"n":"Rivet AI","p":"Free","c":"AI Developer Tools","u":"https://rivet.ironcladapp.com","d":"Free · Visual node-based AI development environment · Build AI agents and workflows visually · Open source with extensible plugin system · No coding required for basic AI flows"},
    {"n":"Jan","p":"Free","c":"AI Developer Tools","u":"https://jan.ai","d":"Free · Open-source AI chat assistant for developers · Run LLMs locally with full privacy · Supports multiple model formats including GGUF · Desktop app with plugin system"},
    {"n":"LibreChat","p":"Free","c":"AI Developer Tools","u":"https://www.librechat.ai","d":"Free · Open-source AI chat platform for developers · Multi-model support with OpenAI, Claude, and more · Self-hosted with full control · Built-in RAG and agent capabilities"},
    {"n":"GPT4All","p":"Free","c":"AI Developer Tools","u":"https://gpt4all.io","d":"Free · Run LLMs locally on your hardware · Open-source ecosystem of AI models · No internet connection required · Desktop app for chat and code assistance"},
    {"n":"AnythingLLM","p":"Free","c":"AI Developer Tools","u":"https://anythingllm.com","d":"Free · Open-source AI document chat and RAG platform · Connect any LLM to your documents · Built-in agent system · Desktop and Docker deployment options"},
    # FREE PLAN 25
    {"n":"Codeium","p":"Free Plan","c":"AI Developer Tools","u":"https://codeium.com","d":"Free Plan available · AI code completion and chat for 70+ languages and 40+ IDEs · Unlimited autocomplete with basic plan · Enterprise-grade AI coding for every developer"},
    {"n":"Amazon Q Developer","p":"Free Plan","c":"AI Developer Tools","u":"https://aws.amazon.com/q/developer","d":"Free Plan available · AWS-native AI coding and development assistant · Code generation, explanation, and security scanning · Integrates with AWS services · Available in IDE and CLI"},
    {"n":"GitHub Copilot Free","p":"Free Plan","c":"AI Developer Tools","u":"https://github.com/features/copilot","d":"Free Plan available · AI pair programmer by GitHub and OpenAI · Code suggestions, chat, and PR summaries · Supports multiple IDEs and languages · Free tier with limited completions"},
    {"n":"Windsurf","p":"Free Plan","c":"AI Developer Tools","u":"https://windsurf.com","d":"Free Plan available · AI-powered code editor with Cascade agentic flow · Multi-file editing with deep codebase understanding · Built-in AI chat and terminal · Free tier for individuals"},
    {"n":"Cursor","p":"Free Plan","c":"AI Developer Tools","u":"https://cursor.com","d":"Free Plan available · AI-first code editor with agent mode · Multi-file editing with AI assistance · Built-in codebase understanding and chat · Free tier with basic AI features"},
    {"n":"Tabnine","p":"Free Plan","c":"AI Developer Tools","u":"https://www.tabnine.com","d":"Free Plan available · AI code completion for 30+ languages · Runs locally for privacy · Whole-line and full-function completion · VS Code, JetBrains, and more"},
    {"n":"Qodo","p":"Free Plan","c":"AI Developer Tools","u":"https://www.qodo.ai","d":"Free Plan available · AI-powered code quality and testing assistant · Generates meaningful test cases automatically · Code review and PR analysis · Multiple language support"},
    {"n":"Bito AI","p":"Free Plan","c":"AI Developer Tools","u":"https://bito.ai","d":"Free Plan available · AI assistant for code review, generation, and explanation · Understands your entire codebase context · One-click code actions in your IDE · Multiple LLM backends"},
    {"n":"Pieces for Developers","p":"Free Plan","c":"AI Developer Tools","u":"https://pieces.app","d":"Free Plan available · AI-enabled code snippet management · Smart copy-paste with context extraction · Code analysis and explanation · Works across all IDEs and browsers"},
    {"n":"Warp AI","p":"Free Plan","c":"AI Developer Tools","u":"https://www.warp.dev","d":"Free Plan available · AI-powered terminal with intelligent commands · Natural language to shell commands · Modern terminal experience with workflows · Built-in AI chat for debugging"},
    {"n":"MarsCode","p":"Free Plan","c":"AI Developer Tools","u":"https://www.marscode.com","d":"Free Plan available · Cloud-based AI IDE with built-in AI assistance · One-click development environment · AI code generation and debugging · Quick projects and collaboration"},
    {"n":"Blackbox AI","p":"Free Plan","c":"AI Developer Tools","u":"https://www.blackbox.ai","d":"Free Plan available · AI code generation, search, and chat · Copy code from any video or image · Supports 100+ programming languages · Browser extension and IDE integration"},
    {"n":"Refact.ai","p":"Free Plan","c":"AI Developer Tools","u":"https://refact.ai","d":"Free Plan available · AI coding assistant with code completion and chat · Fine-tuning on your private codebase · Privacy-first with self-hosting option · Fast inference"},
    {"n":"CodeGPT","p":"Free Plan","c":"AI Developer Tools","u":"https://codegpt.co","d":"Free Plan available · AI assistant for VS Code and JetBrains · Connect your own API key for any LLM · Code generation, refactoring, and explanation · Multiple AI provider support"},
    {"n":"Double.bot","p":"Free Plan","c":"AI Developer Tools","u":"https://double.bot","d":"Free Plan available · AI coding assistant for rapid development · Code generation, refactoring, and explanation · Context-aware suggestions · Browser-based and IDE integration"},
    {"n":"Greptile","p":"Free Plan","c":"AI Developer Tools","u":"https://www.greptile.com","d":"Free Plan available · AI-powered code review for GitHub PRs · Understands large codebases with deep context · Automated review comments and suggestions · Reduces review time significantly"},
    {"n":"CodeComplete","p":"Free Plan","c":"AI Developer Tools","u":"https://codecomplete.ai","d":"Free Plan available · Enterprise-focused AI code completion · Self-hosted for data privacy and security · Trained on your codebase · All major programming languages"},
    {"n":"Visual Studio IntelliCode","p":"Free Plan","c":"AI Developer Tools","u":"https://visualstudio.microsoft.com/services/intellicode","d":"Free Plan available · AI-assisted code completion by Microsoft · Whole-line completions and style recommendations · Trained on thousands of open-source repos · VS Code integration"},
    {"n":"Codiga","p":"Free Plan","c":"AI Developer Tools","u":"https://www.codiga.io","d":"Free Plan available · AI code analysis and static analysis tool · Automated code reviews with custom rules · Security vulnerability detection · IDE integration for real-time feedback"},
    {"n":"Continue Hub","p":"Free Plan","c":"AI Developer Tools","u":"https://continue.dev","d":"Free Plan available · Cloud hub for Continue AI coding assistant · Share and discover AI configuration snippets · Community-driven extensions and rules · Enhanced code completion and chat"},
    {"n":"Tabby Cloud","p":"Free Plan","c":"AI Developer Tools","u":"https://tabbyml.com","d":"Free Plan available · Cloud-hosted version of Tabby code assistant · No setup required for AI code completion · Privacy-respecting cloud infrastructure · Fast responses with multiple models"},
    {"n":"CodiumAI","p":"Free Plan","c":"AI Developer Tools","u":"https://www.codium.ai","d":"Free Plan available · AI-powered test generation and code review · Meaningful test suite creation · Identifies edge cases and bugs · Free tier for individual developers"},
    {"n":"JetBrains AI","p":"Free Plan","c":"AI Developer Tools","u":"https://www.jetbrains.com/ai","d":"Free Plan available · AI-powered coding assistance in JetBrains IDEs · Code generation, explanation, and refactoring · Deep integration with JetBrains ecosystem · Multiple LLM providers"},
    {"n":"PearAI Cloud","p":"Free Plan","c":"AI Developer Tools","u":"https://trypear.ai","d":"Free Plan available · Cloud version of PearAI code editor · AI-powered code editing from anywhere · No local installation needed · Built-in AI chat and completion"},
    {"n":"Sourcegraph Cody Free","p":"Free Plan","c":"AI Developer Tools","u":"https://sourcegraph.com/cody","d":"Free Plan available · AI coding assistant with deep codebase understanding · Context-aware code suggestions · Integrated with VS Code and JetBrains · Free tier for open source"},
    # FREE TRIAL 25
    {"n":"Replit Agent","p":"Free Trial","c":"AI Developer Tools","u":"https://replit.com","d":"Free Trial · AI coding agent that builds and deploys full-stack applications · Natural language to working code · Integrated cloud IDE with instant preview · Deploy with one click"},
    {"n":"Devin AI","p":"Free Trial","c":"AI Developer Tools","u":"https://devin.ai","d":"Free Trial · Fully autonomous AI software engineer by Cognition · Handles entire development tasks end-to-end · Can debug, build, and deploy independently · First AI engineer with real capabilities"},
    {"n":"Claude Code Max","p":"Free Trial","c":"AI Developer Tools","u":"https://www.anthropic.com/claude-code","d":"Free Trial · Anthropic's agentic coding tool powered by Claude · Autonomous code editing, testing, and debugging · Deep understanding of complex codebases · Terminal-native with Git integration"},
    {"n":"Magic.dev","p":"Free Trial","c":"AI Developer Tools","u":"https://magic.dev","d":"Free Trial · AI software engineer with superhuman capabilities · Handles million-line codebases · Long-context understanding and reasoning · Enterprise-focused AI development platform"},
    {"n":"Lovable Pro","p":"Free Trial","c":"AI Developer Tools","u":"https://lovable.dev","d":"Free Trial · AI-powered full-stack application builder · Generate production-ready apps from prompts · Supabase integration for backend · Beautiful UI with modern frameworks"},
    {"n":"v0 Premium","p":"Free Trial","c":"AI Developer Tools","u":"https://v0.dev","d":"Free Trial · Premium AI UI code generator by Vercel · Generate React components from text descriptions · Production-ready code with Tailwind CSS · One-click deploy to Vercel"},
    {"n":"Bolt.new Pro","p":"Free Trial","c":"AI Developer Tools","u":"https://bolt.new","d":"Free Trial · Professional AI web application builder · Generate full-stack apps in the browser · Instant preview and deployment · Node.js, Python, and more supported"},
    {"n":"Kiro","p":"Free Trial","c":"AI Developer Tools","u":"https://kiro.dev","d":"Free Trial · AI-powered integrated development environment · Intelligent code completion and generation · Built-in AI chat for coding assistance · Modern IDE with AI-first approach"},
    {"n":"Ellipsis","p":"Free Trial","c":"AI Developer Tools","u":"https://www.ellipsis.dev","d":"Free Trial · AI-powered code review for GitHub pull requests · Automated feedback on code quality · Security and performance suggestions · CI/CD pipeline integration"},
    {"n":"Metabob","p":"Free Trial","c":"AI Developer Tools","u":"https://metabob.com","d":"Free Trial · AI code review and debugging tool · Detects bugs, vulnerabilities, and code smells · Graph-based code analysis · Automated fix suggestions"},
    {"n":"CodeScene","p":"Free Trial","c":"AI Developer Tools","u":"https://codescene.com","d":"Free Trial · AI-powered code analysis for software engineering · Identifies hotspots, complexity, and technical debt · Social code analysis for team patterns · Enterprise analytics"},
    {"n":"DeepCode AI","p":"Free Trial","c":"AI Developer Tools","u":"https://snyk.io/platform/deepcode-ai","d":"Free Trial · AI code analysis platform by Snyk · Real-time vulnerability detection · Security-focused code review · GitHub, GitLab, and more integrations"},
    {"n":"Embold","p":"Free Trial","c":"AI Developer Tools","u":"https://embold.io","d":"Free Trial · AI-powered code quality analysis · Detects bugs, vulnerabilities, and design flaws · Multi-language static analysis · Smart fix recommendations"},
    {"n":"SonarQube Advanced","p":"Free Trial","c":"AI Developer Tools","u":"https://www.sonarsource.com/products/sonarqube","d":"Free Trial · Advanced AI code quality and security platform · Continuous code quality inspection · Detect bugs, code smells, vulnerabilities · Industry-leading static analysis"},
    {"n":"Qwiet AI","p":"Free Trial","c":"AI Developer Tools","u":"https://qwiet.ai","d":"Free Trial · AI-powered application security platform · SCA, SAST, and container scanning · Prioritize vulnerabilities by exploitability · Developer workflow integration"},
    {"n":"Codacy","p":"Free Trial","c":"AI Developer Tools","u":"https://www.codacy.com","d":"Free Trial · Automated AI code review and quality analysis · Multi-language support with 40+ languages · Track code quality over time · PR analysis with automated feedback"},
    {"n":"Checkmarx One","p":"Free Trial","c":"AI Developer Tools","u":"https://checkmarx.com","d":"Free Trial · Comprehensive AI code security platform · SAST, SCA, and IAST in one platform · AI-powered vulnerability detection · Enterprise application security testing"},
    {"n":"Harness AI Developer","p":"Free Trial","c":"AI Developer Tools","u":"https://www.harness.io","d":"Free Trial · AI-powered software development platform · CI/CD with AI optimization · Automated testing and deployment · Developer productivity analytics"},
    {"n":"Graphite AI","p":"Free Trial","c":"AI Developer Tools","u":"https://graphite.dev","d":"Free Trial · AI-enhanced code review platform · PR management with AI suggestions · Automate code review workflows · Batching and stacking PRs with AI"},
    {"n":"Poolside","p":"Free Trial","c":"AI Developer Tools","u":"https://poolside.ai","d":"Free Trial · Enterprise-focused AI coding platform · Large-scale code generation and understanding · Custom model training for organizations · Foundation models for software engineering"},
    {"n":"Fine.dev","p":"Free Trial","c":"AI Developer Tools","u":"https://fine.dev","d":"Free Trial · AI software engineer for building production apps · End-to-end development from specs · Autonomous coding with human-in-the-loop · Multi-framework support"},
    {"n":"Factory AI","p":"Free Trial","c":"AI Developer Tools","u":"https://factory.ai","d":"Free Trial · AI-powered engineering productivity platform · Automated code generation and review · Droid AI agents for development tasks · Enterprise-grade tools"},
    {"n":"SoftSpell","p":"Free Trial","c":"AI Developer Tools","u":"https://softspell.ai","d":"Free Trial · AI code assistant for intelligent code writing · Code generation with context understanding · Multi-language support · Seamless IDE integration"},
    {"n":"Continue Teams","p":"Free Trial","c":"AI Developer Tools","u":"https://continue.dev","d":"Free Trial · Enterprise version of Continue AI coding assistant · Team configuration and shared rules · Centralized AI model management · Analytics and usage tracking"},
    {"n":"Sourcegraph Enterprise","p":"Free Trial","c":"AI Developer Tools","u":"https://sourcegraph.com","d":"Free Trial · Enterprise code intelligence platform · Search and navigate across all repositories · Code search with AI-powered insights · Security and compliance monitoring"},
    # PAID 25
    {"n":"GitHub Copilot Pro","p":"Paid","c":"AI Developer Tools","u":"https://github.com/features/copilot","d":"Paid · Advanced AI pair programmer with unlimited completions · Priority access to latest models · Multi-IDE support with deep integration · AI chat, PR summaries, and code review"},
    {"n":"Cursor Pro","p":"Paid","c":"AI Developer Tools","u":"https://cursor.com","d":"Paid · Professional AI code editor with advanced agent mode · Unlimited fast premium model requests · Multi-file AI editing with codebase understanding · Priority support and team features"},
    {"n":"Windsurf Pro","p":"Paid","c":"AI Developer Tools","u":"https://windsurf.com","d":"Paid · Professional AI code editor with Cascade Pro · Unlimited AI actions and premium model access · Advanced multi-file editing · Enhanced codebase awareness and context"},
    {"n":"Tabnine Pro","p":"Paid","c":"AI Developer Tools","u":"https://www.tabnine.com","d":"Paid · Professional AI code completion · Custom model training on your codebase · Advanced privacy with on-premise option · Team management and analytics dashboards"},
    {"n":"Claude Code","p":"Paid","c":"AI Developer Tools","u":"https://www.anthropic.com/claude-code","d":"Paid · Anthropic's agentic coding tool powered by Claude · Autonomous code editing, testing, and debugging · Deep understanding of complex codebases · Terminal-native with Git"},
    {"n":"JetBrains AI Pro","p":"Paid","c":"AI Developer Tools","u":"https://www.jetbrains.com/ai","d":"Paid · Premium AI coding assistant across all JetBrains IDEs · Unlimited AI actions and premium model access · Advanced code generation and refactoring · Enterprise security"},
    {"n":"Augment Code","p":"Paid","c":"AI Developer Tools","u":"https://www.augmentcode.com","d":"Paid · Enterprise AI coding assistant with deep code understanding · Context-aware suggestions across codebase · Code review and security analysis · Private model training on your code"},
    {"n":"MutableAI","p":"Paid","c":"AI Developer Tools","u":"https://mutable.ai","d":"Paid · AI-accelerated software development platform · Auto-generate documentation and type annotations · Refactor codebase with AI assistance · GitHub integration for workflows"},
    {"n":"CodeRabbit","p":"Paid","c":"AI Developer Tools","u":"https://coderabbit.ai","d":"Paid · AI-powered code review for pull requests · Line-by-line code analysis and suggestions · Security vulnerability detection · Reduces review time by up to 80%"},
    {"n":"CodeWP Pro","p":"Paid","c":"AI Developer Tools","u":"https://codewp.ai","d":"Paid · Professional AI code generator for WordPress · Create plugins, themes, and custom code · WooCommerce and popular plugin support · Mode-specific generation"},
    {"n":"AskCodi Premium","p":"Paid","c":"AI Developer Tools","u":"https://www.askcodi.com","d":"Paid · Premium AI coding assistant with advanced features · Code generation, explanation, and testing · Multi-language support with frameworks · Priority support and unlimited usage"},
    {"n":"Qodo Pro","p":"Paid","c":"AI Developer Tools","u":"https://www.qodo.ai","d":"Paid · Professional AI code quality and testing platform · Advanced test generation with coverage analysis · PR review automation · Enterprise security and compliance"},
    {"n":"Bito AI Pro","p":"Paid","c":"AI Developer Tools","u":"https://bito.ai","d":"Paid · Professional AI code review and chat assistant · Advanced codebase understanding · Automated PR reviews and suggestions · Team collaboration and analytics"},
    {"n":"Pieces Pro","p":"Paid","c":"AI Developer Tools","u":"https://pieces.app","d":"Paid · Professional AI developer productivity suite · Advanced code snippet management with AI · Workflow automation and team sharing · Enterprise security and SSO"},
    {"n":"Jam AI","p":"Paid","c":"AI Developer Tools","u":"https://jam.dev","d":"Paid · AI-powered debugging assistant for developers · Automatic bug report analysis · Session replay with AI insights · Integrates with development workflows"},
    {"n":"CodeMate Pro","p":"Paid","c":"AI Developer Tools","u":"https://codemate.ai","d":"Paid · AI debugging and code assistance platform · Intelligent error detection and fixes · Code optimization suggestions · Multi-language IDE support"},
    {"n":"Sourcegraph Cody Enterprise","p":"Paid","c":"AI Developer Tools","u":"https://sourcegraph.com/cody","d":"Paid · Enterprise-grade AI coding assistant · Deep codebase intelligence across repositories · Custom model hosting for data privacy · Advanced security and access controls"},
    {"n":"Replit Core","p":"Paid","c":"AI Developer Tools","u":"https://replit.com","d":"Paid · Cloud IDE with advanced AI coding features · AI agent that builds and deploys full-stack apps · Integrated hosting and deployment · Collaborative coding with AI"},
    {"n":"Magic.dev Pro","p":"Paid","c":"AI Developer Tools","u":"https://magic.dev","d":"Paid · Professional AI software engineer platform · Handles million-line codebases · Long-context reasoning and planning · Enterprise-focused AI development"},
    {"n":"Factory AI Pro","p":"Paid","c":"AI Developer Tools","u":"https://factory.ai","d":"Paid · Professional AI engineering productivity platform · Automated code generation and review at scale · Droid AI agents for complex development · Enterprise team features"},
    {"n":"Poolside Enterprise","p":"Paid","c":"AI Developer Tools","u":"https://poolside.ai","d":"Paid · Enterprise AI coding platform with custom training · Large-scale code generation · Private model deployment · Foundation models for software engineering"},
    {"n":"Graphite Teams","p":"Paid","c":"AI Developer Tools","u":"https://graphite.dev","d":"Paid · Team AI code review platform · PR management with AI suggestions · Automate review workflows · Batching and stacking with team features"},
    {"n":"CodeStory Pro","p":"Paid","c":"AI Developer Tools","u":"https://codestory.ai","d":"Paid · AI-powered IDE assistant with natural language editing · Edit code through conversational commands · Deep codebase understanding · Multi-file refactoring with AI"},
    {"n":"Fine.dev Pro","p":"Paid","c":"AI Developer Tools","u":"https://fine.dev","d":"Paid · Professional AI software engineer platform · End-to-end development from specs · Advanced autonomous coding · Multi-framework and team support"},
    {"n":"Devin Enterprise","p":"Paid","c":"AI Developer Tools","u":"https://devin.ai","d":"Paid · Enterprise autonomous AI software engineer · Full development lifecycle management · Team collaboration and project tracking · Production deployment capabilities"},
]

G = "AI Developer Tools"
EX_POS = [1, 2, 0]  # rotate: pos2, pos3, pos1

# Build catalog entries
cat_entries = [{"n":t["n"],"d":t["d"],"c":t["c"],"g":G,"p":t["p"],"u":t["u"]} for t in TOOLS]

# Build verified pool entries with exclusive flags
ver_entries = []
for i, t in enumerate(TOOLS):
    gi = i // 5
    pos = i % 5
    is_ex = (pos == EX_POS[gi % 3])
    ver_entries.append({"n":t["n"],"d":t["d"],"c":t["c"],"g":G,"p":t["p"],"u":t["u"],"fl":"exclusive" if is_ex else ""})

# Load and update catalog-0.json
with open(os.path.join(PUB,"ai-catalog-0.json")) as f: c0=json.load(f)
c0 = cat_entries + c0
print(f"catalog-0: {len(c0)}")

# Load and update catalog-1.json (also prepend so they appear in all)
with open(os.path.join(PUB,"ai-catalog-1.json")) as f: c1=json.load(f)
c1 = cat_entries + c1
print(f"catalog-1: {len(c1)}")

# Load and update catalog-2.json
with open(os.path.join(PUB,"ai-catalog-2.json")) as f: c2=json.load(f)
c2 = cat_entries + c2
print(f"catalog-2: {len(c2)}")

# Load and update full catalog
with open(os.path.join(PUB,"ai-catalog.json")) as f: cf=json.load(f)
cf["tools"] = cat_entries + cf["tools"]
print(f"catalog.json: {len(cf['tools'])}")

# Load and update verified pool
with open(os.path.join(PUB,"verified-top-pool.json")) as f: vp=json.load(f)
vp = ver_entries + vp
print(f"verified pool: {len(vp)}")

# Write all
for fn, data in [("ai-catalog-0.json",c0),("ai-catalog-1.json",c1),("ai-catalog-2.json",c2)]:
    with open(os.path.join(PUB,fn),"w") as f: json.dump(data,f,ensure_ascii=False,separators=(",",":"))
    print(f"  wrote {fn}")

with open(os.path.join(PUB,"ai-catalog.json"),"w") as f: json.dump(cf,f,ensure_ascii=False,separators=(",",":"))
print("  wrote ai-catalog.json")

with open(os.path.join(PUB,"verified-top-pool.json"),"w") as f: json.dump(vp,f,ensure_ascii=False,separators=(",",":"))
print("  wrote verified-top-pool.json")

ex_count = sum(1 for e in ver_entries if e["fl"]=="exclusive")
print(f"\nDONE: {len(TOOLS)} tools added, {ex_count} exclusives, category={G}")
print("Order: Free(25) -> Free Plan(25) -> Free Trial(25) -> Paid(25)")