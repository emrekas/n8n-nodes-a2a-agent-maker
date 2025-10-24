const path = require('path');
const { task, src, dest, parallel } = require('gulp');

task('build:icons', copyIcons);
task('build:prompts', copyPrompts);
task('build', parallel('build:icons', 'build:prompts'));

function copyIcons() {
	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes');

	src(nodeSource).pipe(dest(nodeDestination));

	const credSource = path.resolve('credentials', '**', '*.{png,svg}');
	const credDestination = path.resolve('dist', 'credentials');

	return src(credSource).pipe(dest(credDestination));
}

function copyPrompts() {
	const promptSource = path.resolve('nodes', '**', '*.prompt');
	const promptDestination = path.resolve('dist', 'nodes');

	return src(promptSource).pipe(dest(promptDestination));
}
