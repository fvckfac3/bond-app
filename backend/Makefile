.PHONY: format lint typecheck check test

format:
	black .
	isort .

lint:
	flake8 .

typecheck:
	mypy .

check: format lint typecheck

test:
	pytest tests
