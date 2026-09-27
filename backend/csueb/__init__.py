import os
from flask import Flask, render_template, redirect, url_for, request, flash, session
from csueb.forms import LoginForm, PostForm, RegisterForm
from csueb.db import get_db



def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'csueb.sqlite'),
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    os.makedirs(app.instance_path, exist_ok=True)

    from . import link
    app.register_blueprint(link.bp)

    @app.route('/')
    @app.route('/home')
    def home():
        return render_template("home.html")

    @app.route('/safety')
    def safety():
        return render_template("safety.html")

    from . import db
    db.init_app(app)

    return app