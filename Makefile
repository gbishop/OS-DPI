dev:
	npm run start

push:
	mv thinking ../thinking
	npm run build
	mv ../thinking thinking
	git add docs
	git commit -m 'build'
	git push origin

test:
	npm run build
	rsync -a docs gb.cs.unc.edu:/home/gb/public_html/tmp/
