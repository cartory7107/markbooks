#!/usr/bin/env python3
"""
Add 100 AI Code Assistant tools to:
  1. ai-catalog-0.json (prepend - used by server build)
  2. ai-catalog.json (prepend - used by client fetch)
  3. verified-top-pool.json (prepend - for exclusive/trending injection)

Rules:
  - Order: Free (25) -> Free Plan (25) -> Paid (25) -> Free Trial (25)
  - Every 5 tools: 1 gets exclusive flag in verified pool
  - Exclusive position in each group of 5 rotates: 2, 3, 1, 2, 3, 1, 2, 3...
  - Links are EXACTLY as provided - NO modification
  - Category (c) = user-provided category, Group (g) = mapped via category-map -> "AI Code Assistant"
  - All g = "AI Code Assistant"
  - Descriptions are rich and detailed
"""

import json
import os
from urllib.parse import urlparse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(BASE, "public")

# ─── All 100 tools in order: Free -> Free Plan -> Paid -> Free Trial ───
ALL_TOOLS = [
    # ═══════════════════ FREE (25) ═══════════════════
    {"n": "Gemini Code Assist", "p": "Free", "c": "AI Code Assistant", "u": "https://developers.google.com/gemini-code-assist",
     "d": "Free · Google's AI-powered code assistant integrated into VS Code and JetBrains IDEs · Real-time code suggestions, explanations, and chat · Supports multiple programming languages · Built on Gemini models"},
    {"n": "Continue", "p": "Free", "c": "Open Source Code Assistant", "u": "https://continue.dev",
     "d": "Free · Open-source AI code assistant for VS Code and JetBrains · Connect to any LLM including GPT-4, Claude, and local models · Inline chat, autocomplete, and codebase context · Highly customizable"},
    {"n": "Cline", "p": "Free", "c": "VS Code AI Coding Agent", "u": "https://cline.bot",
     "d": "Free · Autonomous AI coding agent for VS Code · Creates files, runs commands, and edits code autonomously · Supports Claude, GPT-4, and other LLMs · Terminal integration with real-time feedback"},
    {"n": "Aider", "p": "Free", "c": "Terminal AI Coding Assistant", "u": "https://aider.chat",
     "d": "Free · AI pair programming in your terminal · Works with Git repositories to make and commit code changes · Supports GPT-4, Claude, and local models · Command-line interface for developers"},
    {"n": "Tabby", "p": "Free", "c": "Self-Hosted Code Assistant", "u": "https://tabbyml.com",
     "d": "Free · Self-hosted AI coding assistant for privacy-first teams · Supports code completion, chat, and codebase awareness · Run on your own hardware · Open source with no data leaks"},
    {"n": "Void Editor", "p": "Free", "c": "AI Code Editor", "u": "https://voideditor.com",
     "d": "Free · AI-native code editor built from the ground up with AI integration · Open source and extensible · Deep AI understanding of your entire codebase · Modern interface with intelligent assistance"},
    {"n": "Zed AI", "p": "Free", "c": "AI Code Editor", "u": "https://zed.dev",
     "d": "Free · High-performance AI code editor built in Rust · Collaborative editing in real-time · AI-powered code completion and chat · Blazing fast startup and file operations"},
    {"n": "PearAI", "p": "Free", "c": "AI Code Editor", "u": "https://trypear.ai",
     "d": "Free · Open-source AI code editor forked from VS Code · Built-in AI chat and code generation · Supports multiple LLM providers · Privacy-focused with local model support"},
    {"n": "OpenCode", "p": "Free", "c": "Open Source Coding Agent", "u": "https://opencode.ai",
     "d": "Free · Terminal-based AI coding agent · Autonomous code editing and file management · Supports multiple AI providers · Open source with extensible architecture"},
    {"n": "CodeGeeX", "p": "Free", "c": "AI Code Completion", "u": "https://codegeex.cn",
     "d": "Free · AI-powered code generation and completion tool · Supports 100+ programming languages · Integrated with VS Code, IntelliJ, and more · Bilingual support for English and Chinese"},
    {"n": "FauxPilot", "p": "Free", "c": "Self-Hosted Code Completion", "u": "https://github.com/fauxpilot/fauxpilot",
     "d": "Free · Open-source alternative to GitHub Copilot · Self-hosted for complete privacy · Uses Codegen model for code generation · Compatible with VS Code and JetBrains"},
    {"n": "OpenHands", "p": "Free", "c": "Open Source AI Software Engineer", "u": "https://openhands.dev",
     "d": "Free · AI software engineer that can resolve GitHub issues autonomously · Open source platform for AI coding agents · Executes code, manages files, and runs tests · Formerly known as OpenDevin"},
    {"n": "Sweep AI Community", "p": "Free", "c": "GitHub AI Coding Assistant", "u": "https://sweep.dev",
     "d": "Free · AI-powered GitHub issue resolver · Automatically generates pull requests for bug fixes and features · Understands your entire codebase · Community edition available for open source projects"},
    {"n": "Open Interpreter", "p": "Free", "c": "AI Coding & Automation", "u": "https://www.openinterpreter.com",
     "d": "Free · AI tool that lets LLMs run code locally on your computer · Execute Python, JavaScript, Shell, and more · Natural language to code execution · Supports GPT-4, Claude, and local models"},
    {"n": "Sourcegraph Cody (Open Source)", "p": "Free", "c": "AI Code Assistant", "u": "https://sourcegraph.com/cody",
     "d": "Free · AI coding assistant with deep codebase understanding · Open source edition with core features · Context-aware code suggestions · Integrated with VS Code and JetBrains"},
    {"n": "GPT Engineer", "p": "Free", "c": "AI Software Builder", "u": "https://gptengineer.app",
     "d": "Free · Specify what you want in plain English and get a working codebase · Generates entire projects from prompts · Iterative refinement through conversation · Open source and community-driven"},
    {"n": "Smol Developer", "p": "Free", "c": "AI Coding Agent", "u": "https://github.com/smol-ai/developer",
     "d": "Free · Lightweight AI coding agent that creates small applications from prompts · Open source with minimal dependencies · Generates clean, working code · Perfect for quick prototypes"},
    {"n": "Devika AI", "p": "Free", "c": "Open Source AI Developer", "u": "https://github.com/stitionai/devika",
     "d": "Free · Open-source AI software engineer · Autonomous coding, debugging, and deployment · Uses GPT-4 for reasoning and planning · Alternative to Devin for open source community"},
    {"n": "Plandex", "p": "Free", "c": "AI Coding Agent", "u": "https://plandex.ai",
     "d": "Free · Open-source AI coding agent for complex tasks · Handles large codebases with multi-step planning · Terminal-based with version control integration · Tracks context across sessions"},
    {"n": "Melty", "p": "Free", "c": "AI Coding Assistant", "u": "https://melty.sh",
     "d": "Free · AI coding assistant that understands your entire codebase · Open source with CLI and IDE integrations · Smart code search and navigation · Context-aware suggestions across files"},
    {"n": "Rivet AI", "p": "Free", "c": "Visual AI Development", "u": "https://rivet.ironcladapp.com",
     "d": "Free · Visual node-based AI development environment · Build AI agents and workflows visually · Open source with extensible plugin system · No coding required for basic AI flows"},
    {"n": "Goose", "p": "Free", "c": "Open Source AI Agent", "u": "https://block.github.io/goose",
     "d": "Free · Open-source AI developer agent by Block · Autonomous coding and toolkit usage · Extensible with custom extensions · Runs locally with multiple LLM support · Built for enterprise developer workflows"},
    {"n": "Kilo Code", "p": "Free", "c": "AI Coding Assistant", "u": "https://kilocode.ai",
     "d": "Free · AI coding assistant with intelligent code completion · Multi-language support with context awareness · Fast and lightweight IDE integration · Helps write, debug, and refactor code"},
    {"n": "Cursor Agent (Open Source Edition)", "p": "Free", "c": "AI Coding Tool", "u": "https://cursor.com",
     "d": "Free · AI-first code editor with agent mode · Open source edition with core AI features · Multi-file editing with AI assistance · Built-in codebase understanding and chat"},
    {"n": "Bolt.diy", "p": "Free", "c": "Open Source AI Coding Platform", "u": "https://boltdiy.dev",
     "d": "Free · Self-hosted AI coding platform · Generate full-stack web applications from prompts · Open source alternative to Bolt.new · Supports multiple LLM providers · Deploy anywhere"},

    # ═══════════════════ FREE PLAN (25) ═══════════════════
    {"n": "Codeium", "p": "Free Plan", "c": "AI Code Assistant", "u": "https://codeium.com",
     "d": "Free Plan available · AI code completion and chat for 70+ languages and 40+ IDEs · Unlimited autocomplete with basic plan · Supports VS Code, JetBrains, and more · Enterprise-grade AI coding"},
    {"n": "Amazon Q Developer", "p": "Free Plan", "c": "AI Code Assistant", "u": "https://aws.amazon.com/q/developer",
     "d": "Free Plan available · AWS-native AI coding and development assistant · Code generation, explanation, and security scanning · Integrates with AWS services · Available in IDE and command line"},
    {"n": "GitHub Copilot Free", "p": "Free Plan", "c": "AI Code Assistant", "u": "https://github.com/features/copilot",
     "d": "Free Plan available · AI pair programmer by GitHub and OpenAI · Code suggestions, chat, and PR summaries · Supports multiple IDEs and languages · Free tier with limited completions per month"},
    {"n": "Windsurf", "p": "Free Plan", "c": "AI Code Editor", "u": "https://windsurf.com",
     "d": "Free Plan available · AI-powered code editor with Cascade agentic flow · Multi-file editing with deep codebase understanding · Built-in AI chat and terminal · Free tier for individual developers"},
    {"n": "Tabnine", "p": "Free Plan", "c": "AI Code Completion", "u": "https://www.tabnine.com",
     "d": "Free Plan available · AI code completion tool supporting 30+ languages · Runs locally for privacy · Whole-line and full-function completion · VS Code, JetBrains, and more integrations"},
    {"n": "Qodo", "p": "Free Plan", "c": "AI Code Quality Assistant", "u": "https://www.qodo.ai",
     "d": "Free Plan available · AI-powered code quality and testing assistant · Generates meaningful test cases automatically · Code review and PR analysis · Supports multiple programming languages"},
    {"n": "Pieces for Developers", "p": "Free Plan", "c": "AI Developer Assistant", "u": "https://pieces.app",
     "d": "Free Plan available · AI-enabled code snippet management · Smart copy-paste with context extraction · Code analysis and explanation · Works across all IDEs and browsers"},
    {"n": "Bito AI", "p": "Free Plan", "c": "AI Code Review", "u": "https://bito.ai",
     "d": "Free Plan available · AI assistant for code review, generation, and explanation · Understands your entire codebase context · One-click code actions in your IDE · Supports multiple LLM backends"},
    {"n": "Codiga", "p": "Free Plan", "c": "AI Code Analysis", "u": "https://www.codiga.io",
     "d": "Free Plan available · AI code analysis and static analysis tool · Automated code reviews with custom rules · Security vulnerability detection · IDE integration for real-time feedback"},
    {"n": "Codiga Hub", "p": "Free Plan", "c": "AI Static Code Analysis", "u": "https://www.codiga.io",
     "d": "Free Plan available · Hub for sharing and discovering AI code analysis rules · Community-driven static analysis recipes · Cross-language support · IDE integrations with real-time alerts"},
    {"n": "CodeComplete", "p": "Free Plan", "c": "Enterprise AI Coding", "u": "https://codecomplete.ai",
     "d": "Free Plan available · Enterprise-focused AI code completion · Self-hosted for data privacy and security · Trained on your codebase · Supports all major programming languages"},
    {"n": "Greptile", "p": "Free Plan", "c": "AI Code Review", "u": "https://www.greptile.com",
     "d": "Free Plan available · AI-powered code review for GitHub PRs · Understands large codebases with deep context · Automated review comments and suggestions · Reduces review time significantly"},
    {"n": "Codium", "p": "Free Plan", "c": "AI Testing & Code Review", "u": "https://www.codium.ai",
     "d": "Free Plan available · AI-powered test generation and code review · Meaningful test suite creation · Identifies edge cases and bugs · Free tier for individual developers"},
    {"n": "Warp AI", "p": "Free Plan", "c": "AI Terminal Assistant", "u": "https://www.warp.dev",
     "d": "Free Plan available · AI-powered terminal with intelligent commands · Natural language to shell commands · Modern terminal experience with workflows · Built-in AI chat for debugging"},
    {"n": "Visual Studio IntelliCode", "p": "Free Plan", "c": "AI Code Completion", "u": "https://visualstudio.microsoft.com/services/intellicode",
     "d": "Free Plan available · AI-assisted code completion by Microsoft · Whole-line completions and style recommendations · Trained on thousands of open-source repos · Integrated into Visual Studio and VS Code"},
    {"n": "CodeMate", "p": "Free Plan", "c": "AI Coding Assistant", "u": "https://codemate.ai",
     "d": "Free Plan available · AI coding assistant for code generation and debugging · Explains code and suggests improvements · Multi-language support · IDE plugin for seamless workflow"},
    {"n": "Double.bot", "p": "Free Plan", "c": "AI Coding Assistant", "u": "https://double.bot",
     "d": "Free Plan available · AI coding assistant for rapid development · Code generation, refactoring, and explanation · Context-aware suggestions · Browser-based and IDE integration"},
    {"n": "Refact.ai", "p": "Free Plan", "c": "AI Coding Assistant", "u": "https://refact.ai",
     "d": "Free Plan available · AI coding assistant with code completion and chat · Fine-tuning on your private codebase · Privacy-first with self-hosting option · Fast inference with small models"},
    {"n": "MarsCode", "p": "Free Plan", "c": "AI IDE", "u": "https://www.marscode.com",
     "d": "Free Plan available · Cloud-based AI IDE with built-in AI assistance · One-click development environment · AI code generation and debugging · Perfect for quick projects and collaboration"},
    {"n": "PearAI Cloud", "p": "Free Plan", "c": "AI Code Editor", "u": "https://trypear.ai",
     "d": "Free Plan available · Cloud version of PearAI code editor · AI-powered code editing from anywhere · No local installation needed · Built-in AI chat and completion"},
    {"n": "Blackbox AI Code", "p": "Free Plan", "c": "AI Coding Assistant", "u": "https://www.blackbox.ai",
     "d": "Free Plan available · AI code generation, search, and chat · Copy code from any video or image · Supports 100+ programming languages · Browser extension and IDE integration"},
    {"n": "CodeGPT", "p": "Free Plan", "c": "AI IDE Extension", "u": "https://codegpt.co",
     "d": "Free Plan available · AI assistant for VS Code and JetBrains · Connect your own API key for any LLM · Code generation, refactoring, and explanation · Multiple AI provider support"},
    {"n": "Tabby Cloud", "p": "Free Plan", "c": "AI Code Completion", "u": "https://tabbyml.com",
     "d": "Free Plan available · Cloud-hosted version of Tabby code assistant · No setup required for AI code completion · Privacy-respecting cloud infrastructure · Fast responses with multiple model support"},
    {"n": "Continue Hub", "p": "Free Plan", "c": "AI IDE Extension", "u": "https://continue.dev",
     "d": "Free Plan available · Cloud hub for Continue AI coding assistant · Share and discover AI configuration snippets · Community-driven extensions and rules · Enhanced code completion and chat"},
    {"n": "JetBrains AI Free", "p": "Free Plan", "c": "AI IDE Assistant", "u": "https://www.jetbrains.com/ai",
     "d": "Free Plan available · AI-powered coding assistance in JetBrains IDEs · Code generation, explanation, and refactoring · Deep integration with JetBrains ecosystem · Supports multiple LLM providers"},

    # ═══════════════════ PAID (25) ═══════════════════
    {"n": "GitHub Copilot Pro", "p": "Paid", "c": "AI Code Assistant", "u": "https://github.com/features/copilot",
     "d": "Paid · Advanced AI pair programmer with unlimited completions · Priority access to latest models · Multi-IDE support with deep integration · AI chat, PR summaries, and code review"},
    {"n": "Cursor Pro", "p": "Paid", "c": "AI Code Editor", "u": "https://cursor.com",
     "d": "Paid · Professional AI code editor with advanced agent mode · Unlimited fast premium model requests · Multi-file AI editing with codebase understanding · Priority support and team features"},
    {"n": "Windsurf Pro", "p": "Paid", "c": "AI Code Editor", "u": "https://windsurf.com",
     "d": "Paid · Professional AI code editor with Cascade Pro · Unlimited AI actions and premium model access · Advanced multi-file editing · Enhanced codebase awareness and context"},
    {"n": "Tabnine Pro", "p": "Paid", "c": "AI Code Completion", "u": "https://www.tabnine.com",
     "d": "Paid · Professional AI code completion with whole-line and full-function suggestions · Custom model training on your codebase · Advanced privacy with on-premise option · Team management and analytics"},
    {"n": "JetBrains AI Pro", "p": "Paid", "c": "AI Coding Assistant", "u": "https://www.jetbrains.com/ai",
     "d": "Paid · Premium AI coding assistant across all JetBrains IDEs · Unlimited AI actions and premium model access · Advanced code generation and refactoring · Enterprise-grade security and compliance"},
    {"n": "Claude Code", "p": "Paid", "c": "AI Coding Agent", "u": "https://www.anthropic.com/claude-code",
     "d": "Paid · Anthropic's agentic coding tool powered by Claude · Autonomous code editing, testing, and debugging · Deep understanding of complex codebases · Terminal-native with Git integration"},
    {"n": "Devin AI", "p": "Paid", "c": "Autonomous AI Software Engineer", "u": "https://devin.ai",
     "d": "Paid · Fully autonomous AI software engineer by Cognition · Handles entire development tasks end-to-end · Can debug, build, and deploy independently · First AI engineer with real-world capabilities"},
    {"n": "Replit Core AI", "p": "Paid", "c": "AI Coding Platform", "u": "https://replit.com",
     "d": "Paid · Cloud IDE with advanced AI coding features · AI agent that builds and deploys full-stack apps · Integrated hosting and deployment · Collaborative coding with AI assistance"},
    {"n": "Lovable", "p": "Paid", "c": "AI Full-Stack App Builder", "u": "https://lovable.dev",
     "d": "Paid · AI-powered full-stack application builder · Generate production-ready apps from prompts · Supabase integration for backend · Beautiful UI with modern frameworks"},
    {"n": "Bolt.new Pro", "p": "Paid", "c": "AI Web App Builder", "u": "https://bolt.new",
     "d": "Paid · Professional AI web application builder · Generate full-stack apps in the browser · Instant preview and deployment · Node.js, Python, and more supported"},
    {"n": "v0 by Vercel Premium", "p": "Paid", "c": "AI UI Code Generator", "u": "https://v0.dev",
     "d": "Paid · Premium AI UI code generator by Vercel · Generate React components and pages from text descriptions · Production-ready code with Tailwind CSS · One-click deploy to Vercel"},
    {"n": "Magic.dev", "p": "Paid", "c": "AI Software Engineer", "u": "https://magic.dev",
     "d": "Paid · AI software engineer with superhuman capabilities · Handles million-line codebases · Long-context understanding and reasoning · Enterprise-focused AI development platform"},
    {"n": "MutableAI", "p": "Paid", "c": "AI Code Generation", "u": "https://mutable.ai",
     "d": "Paid · AI-accelerated software development platform · Auto-generate documentation and type annotations · Refactor codebase with AI assistance · GitHub integration for automated workflows"},
    {"n": "CodeRabbit", "p": "Paid", "c": "AI Code Review", "u": "https://coderabbit.ai",
     "d": "Paid · AI-powered code review for pull requests · Line-by-line code analysis and suggestions · Security vulnerability detection · Reduces review time by up to 80%"},
    {"n": "CodiumAI Teams", "p": "Paid", "c": "AI Code Testing", "u": "https://www.codium.ai",
     "d": "Paid · Enterprise AI test generation platform · Automated meaningful test suite creation · Behavioral analysis for edge cases · Team collaboration and test management"},
    {"n": "Qodo Pro", "p": "Paid", "c": "AI Code Quality Assistant", "u": "https://www.qodo.ai",
     "d": "Paid · Professional AI code quality and testing platform · Advanced test generation with coverage analysis · PR review automation · Enterprise security and compliance features"},
    {"n": "Sourcegraph Cody Enterprise", "p": "Paid", "c": "Enterprise AI Coding", "u": "https://sourcegraph.com/cody",
     "d": "Paid · Enterprise-grade AI coding assistant · Deep codebase intelligence across repositories · Custom model hosting for data privacy · Advanced security and access controls"},
    {"n": "AskCodi Premium", "p": "Paid", "c": "AI Coding Assistant", "u": "https://www.askcodi.com",
     "d": "Paid · Premium AI coding assistant with advanced features · Code generation, explanation, and testing · Multi-language support with frameworks · Priority support and unlimited usage"},
    {"n": "CodeWP Pro", "p": "Paid", "c": "WordPress AI Coding", "u": "https://codewp.ai",
     "d": "Paid · Professional AI code generator for WordPress · Create plugins, themes, and custom code · WooCommerce and popular plugin support · Mode-specific generation for different needs"},
    {"n": "Jam AI Developer", "p": "Paid", "c": "AI Debugging Assistant", "u": "https://jam.dev",
     "d": "Paid · AI-powered debugging assistant for developers · Automatic bug report analysis · Session replay with AI insights · Integrates with development workflows"},
    {"n": "Bito AI Pro", "p": "Paid", "c": "AI Code Review & Chat", "u": "https://bito.ai",
     "d": "Paid · Professional AI code review and chat assistant · Advanced codebase understanding · Automated PR reviews and suggestions · Team collaboration features and analytics"},
    {"n": "Pieces for Developers Pro", "p": "Paid", "c": "AI Developer Assistant", "u": "https://pieces.app",
     "d": "Paid · Professional AI developer productivity suite · Advanced code snippet management with AI · Workflow automation and team sharing · Enterprise security and SSO integration"},
    {"n": "Augment Code", "p": "Paid", "c": "AI Coding Assistant", "u": "https://www.augmentcode.com",
     "d": "Paid · Enterprise AI coding assistant with deep code understanding · Context-aware suggestions across your codebase · Code review and security analysis · Private model training on your code"},
    {"n": "CodeMate AI", "p": "Paid", "c": "AI Debugging & Code Assistant", "u": "https://codemate.ai",
     "d": "Paid · AI debugging and code assistance platform · Intelligent error detection and fixes · Code optimization suggestions · Multi-language IDE support"},
    {"n": "CodeStory", "p": "Paid", "c": "AI IDE Assistant", "u": "https://codestory.ai",
     "d": "Paid · AI-powered IDE assistant with natural language editing · Edit code through conversational commands · Deep codebase understanding and navigation · Multi-file refactoring with AI"},

    # ═══════════════════ FREE TRIAL (25) ═══════════════════
    {"n": "Replit Agent", "p": "Free Trial", "c": "AI Coding Agent", "u": "https://replit.com",
     "d": "Free Trial · AI coding agent that builds and deploys full-stack applications · Natural language to working code · Integrated cloud IDE with instant preview · Deploy with one click"},
    {"n": "Lovable Pro", "p": "Free Trial", "c": "AI Full-Stack Development", "u": "https://lovable.dev",
     "d": "Free Trial · AI full-stack development platform · Generate production-ready apps from prompts · Built-in authentication and database · Beautiful UI with responsive design"},
    {"n": "v0 Premium", "p": "Free Trial", "c": "AI UI Code Generator", "u": "https://v0.dev",
     "d": "Free Trial · Premium AI UI code generator · Create stunning React components from descriptions · Shadcn UI and Tailwind CSS integration · Export production-ready code"},
    {"n": "SoftSpell", "p": "Free Trial", "c": "AI Code Assistant", "u": "https://softspell.ai",
     "d": "Free Trial · AI code assistant for intelligent code writing · Code generation with context understanding · Multi-language support · Seamless IDE integration"},
    {"n": "Ellipsis", "p": "Free Trial", "c": "AI Code Review", "u": "https://www.ellipsis.dev",
     "d": "Free Trial · AI-powered code review for GitHub pull requests · Automated feedback on code quality · Security and performance suggestions · Integrates with CI/CD pipelines"},
    {"n": "Metabob", "p": "Free Trial", "c": "AI Code Review & Debugging", "u": "https://metabob.com",
     "d": "Free Trial · AI code review and debugging tool · Detects bugs, vulnerabilities, and code smells · Graph-based code analysis · Automated fix suggestions"},
    {"n": "CodeScene", "p": "Free Trial", "c": "Code Analysis", "u": "https://codescene.com",
     "d": "Free Trial · AI-powered code analysis for software engineering · Identifies hotspots, complexity, and technical debt · Social code analysis for team patterns · Enterprise-grade analytics dashboard"},
    {"n": "DeepCode AI", "p": "Free Trial", "c": "AI Code Analysis", "u": "https://snyk.io/platform/deepcode-ai",
     "d": "Free Trial · AI code analysis platform by Snyk · Real-time vulnerability detection · Security-focused code review · Integrates with GitHub, GitLab, and more"},
    {"n": "Embold", "p": "Free Trial", "c": "AI Code Quality", "u": "https://embold.io",
     "d": "Free Trial · AI-powered code quality analysis · Detects bugs, vulnerabilities, and design flaws · Multi-language static analysis · Smart fix recommendations"},
    {"n": "SonarQube Advanced", "p": "Free Trial", "c": "AI Code Quality", "u": "https://www.sonarsource.com/products/sonarqube",
     "d": "Free Trial · Advanced AI code quality and security platform · Continuous inspection of code quality · Detect bugs, code smells, and vulnerabilities · Industry-leading static analysis engine"},
    {"n": "Qwiet AI", "p": "Free Trial", "c": "AI Application Security", "u": "https://qwiet.ai",
     "d": "Free Trial · AI-powered application security platform · SCA, SAST, and container scanning · Prioritize vulnerabilities by exploitability · Integrated with developer workflows"},
    {"n": "Codacy", "p": "Free Trial", "c": "AI Code Review", "u": "https://www.codacy.com",
     "d": "Free Trial · Automated AI code review and quality analysis · Multi-language support with 40+ languages · Track code quality over time · PR analysis with automated feedback"},
    {"n": "Checkmarx One", "p": "Free Trial", "c": "AI Code Security", "u": "https://checkmarx.com",
     "d": "Free Trial · Comprehensive AI code security platform · SAST, SCA, and IAST in one platform · AI-powered vulnerability detection · Enterprise-grade application security testing"},
    {"n": "Harness AI Developer", "p": "Free Trial", "c": "AI Development Platform", "u": "https://www.harness.io",
     "d": "Free Trial · AI-powered software development platform · CI/CD with AI optimization · Automated testing and deployment · Developer productivity analytics"},
    {"n": "Sourcegraph Enterprise", "p": "Free Trial", "c": "Enterprise Code Intelligence", "u": "https://sourcegraph.com",
     "d": "Free Trial · Enterprise code intelligence platform · Search and navigate across all repositories · Code search with AI-powered insights · Security and compliance monitoring"},
    {"n": "Graphite AI", "p": "Free Trial", "c": "AI Code Review", "u": "https://graphite.dev",
     "d": "Free Trial · AI-enhanced code review platform · PR management with AI suggestions · Automate code review workflows · Batching and stacking PRs with AI"},
    {"n": "Poolside", "p": "Free Trial", "c": "Enterprise AI Coding", "u": "https://poolside.ai",
     "d": "Free Trial · Enterprise-focused AI coding platform · Large-scale code generation and understanding · Custom model training for organizations · Foundation models for software engineering"},
    {"n": "Coderabbit Teams", "p": "Free Trial", "c": "AI Pull Request Review", "u": "https://coderabbit.ai",
     "d": "Free Trial · Team-oriented AI pull request review · Automated code analysis and suggestions · Configuration per repository and team · Integration with Slack and Jira"},
    {"n": "GitLab Duo Pro", "p": "Free Trial", "c": "AI DevOps Assistant", "u": "https://about.gitlab.com/gitlab-duo",
     "d": "Free Trial · AI-powered DevOps assistant by GitLab · Code suggestions, chat, and vulnerability fixes · Integrated into GitLab CI/CD pipeline · Enterprise security and compliance"},
    {"n": "JetBrains Junie", "p": "Free Trial", "c": "AI Coding Agent", "u": "https://www.jetbrains.com/junie",
     "d": "Free Trial · AI coding agent by JetBrains · Autonomous code editing and task completion · Deep IDE integration · Multi-step code generation and refactoring"},
    {"n": "Kiro", "p": "Free Trial", "c": "AI IDE", "u": "https://kiro.dev",
     "d": "Free Trial · AI-powered integrated development environment · Intelligent code completion and generation · Built-in AI chat for coding assistance · Modern IDE with AI-first approach"},
    {"n": "CodeFlash", "p": "Free Trial", "c": "AI Code Optimization", "u": "https://www.codeflash.ai",
     "d": "Free Trial · AI-powered code optimization tool · Automatic performance improvements · Identifies bottlenecks and suggests fixes · Maintains code readability while optimizing"},
    {"n": "Continue Teams", "p": "Free Trial", "c": "Enterprise AI Coding", "u": "https://continue.dev",
     "d": "Free Trial · Enterprise version of Continue AI coding assistant · Team configuration and shared rules · Centralized AI model management · Analytics and usage tracking"},
    {"n": "Fine.dev", "p": "Free Trial", "c": "AI Software Engineer", "u": "https://fine.dev",
     "d": "Free Trial · AI software engineer for building production apps · End-to-end development from specs · Autonomous coding with human-in-the-loop · Multi-framework support"},
    {"n": "Factory AI", "p": "Free Trial", "c": "AI Engineering Platform", "u": "https://factory.ai",
     "d": "Free Trial · AI-powered engineering productivity platform · Automated code generation and review · Droid AI agents for development tasks · Enterprise-grade AI development tools"},
]

# ─── Build catalog entries (for ai-catalog) ───
catalog_entries = []
for t in ALL_TOOLS:
    catalog_entries.append({
        "n": t["n"],
        "d": t["d"],
        "c": t["c"],
        "g": "AI Code Assistant",  # all map to this group
        "p": t["p"],
        "u": t["u"],
    })

# ─── Build verified pool entries (for verified-top-pool) with exclusive flags ───
# Every 5 tools: 1 exclusive. Position rotates: 2, 3, 1, 2, 3, 1...
EXCLUSIVE_POSITIONS = [1, 2, 0]  # 0-indexed: pos2, pos3, pos1

verified_entries = []
for i, t in enumerate(ALL_TOOLS):
    group_idx = i // 5
    pos_in_group = i % 5
    exclusive_pos = EXCLUSIVE_POSITIONS[group_idx % 3]
    
    is_exclusive = (pos_in_group == exclusive_pos)
    
    entry = {
        "n": t["n"],
        "d": t["d"],
        "c": t["c"],
        "g": "AI Code Assistant",
        "p": t["p"],
        "u": t["u"],
        "fl": "exclusive" if is_exclusive else "",
    }
    verified_entries.append(entry)

# ─── Update ai-catalog-0.json (prepend) ───
print("Loading ai-catalog-0.json...")
with open(os.path.join(PUBLIC, "ai-catalog-0.json")) as f:
    catalog_0 = json.load(f)
catalog_0 = catalog_entries + catalog_0
print(f"  ai-catalog-0.json: {len(catalog_0)} tools (added {len(catalog_entries)})")

# ─── Update ai-catalog.json (prepend) ───
print("Loading ai-catalog.json...")
with open(os.path.join(PUBLIC, "ai-catalog.json")) as f:
    catalog_full = json.load(f)
catalog_full["tools"] = catalog_entries + catalog_full["tools"]
print(f"  ai-catalog.json: {len(catalog_full['tools'])} tools (added {len(catalog_entries)})")

# ─── Update verified-top-pool.json (prepend) ───
print("Loading verified-top-pool.json...")
with open(os.path.join(PUBLIC, "verified-top-pool.json")) as f:
    verified_pool = json.load(f)
verified_pool = verified_entries + verified_pool
print(f"  verified-top-pool.json: {len(verified_pool)} entries (added {len(verified_entries)})")

# ─── Update ai-catalog-meta.json category counts ───
print("Loading ai-catalog-meta.json...")
with open(os.path.join(PUBLIC, "ai-catalog-meta.json")) as f:
    meta = json.load(f)

# Count new AI Code Assistant tools
code_count = sum(1 for t in catalog_entries if t["g"] == "AI Code Assistant")
# Update category counts (categories is a list, not dict - it's just a sorted list of category names)
# The meta.categories is a list of category names, meta.categoryEmojis maps name->emoji
# We don't need to update the list of names, just note that AI Code Assistant count increased
print(f"  AI Code Assistant tools added: {code_count}")

# ─── Write all files ───
print("\nWriting files...")

# Write catalog-0 (this is a large file - write carefully)
with open(os.path.join(PUBLIC, "ai-catalog-0.json"), "w") as f:
    json.dump(catalog_0, f, ensure_ascii=False, separators=(",", ":"))
print(f"  Wrote ai-catalog-0.json")

# Write full catalog
with open(os.path.join(PUBLIC, "ai-catalog.json"), "w") as f:
    json.dump(catalog_full, f, ensure_ascii=False, separators=(",", ":"))
print(f"  Wrote ai-catalog.json")

# Write verified pool
with open(os.path.join(PUBLIC, "verified-top-pool.json"), "w") as f:
    json.dump(verified_pool, f, ensure_ascii=False, separators=(",", ":"))
print(f"  Wrote verified-top-pool.json")

# ─── Summary ───
exclusive_count = sum(1 for e in verified_entries if e["fl"] == "exclusive")
print(f"\n{'='*50}")
print(f"SUCCESS!")
print(f"  Total tools added: {len(ALL_TOOLS)}")
print(f"  Free: 25 | Free Plan: 25 | Paid: 25 | Free Trial: 25")
print(f"  Exclusive tools (in verified pool): {exclusive_count}")
print(f"  All URLs preserved exactly as provided")
print(f"  All tools have g='AI Code Assistant'")
print(f"  Tools prepended to TOP of all data files")
print(f"{'='*50}")