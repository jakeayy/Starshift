const { join } = require("path")
const { existsSync, openSync, appendFileSync } = require("fs")
const { inspect } = require("util")

import { LOGS_PATH } from "./const.js"

export default class Logger {
	static LOG_PATH = (() => {
		const date = new Date();
		const formattedDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
		
		return join(LOGS_PATH, `${formattedDate}.log`)
	})()
	static LOG_FILE = openSync(this.LOG_PATH, "a")

	static patchConsole() {
		const fd = this.LOG_FILE;
		;["log", "error", "warn", "debug"].forEach(method => {
			const o = console[method],
				label = method.toUpperCase();

			console[method] = function(...args) {
				const content = args.map(arg => typeof arg === "string" ? arg : inspect(arg)).join(" ")
				const line = `[${new Date().toISOString()}] [${label}] ${content}\n`
				appendFileSync(fd, line)

				return o.apply(this, args)
			}
		})
	}
}