import functools
from datetime import datetime
from werkzeug.security import (check_password_hash, generate_password_hash)
from uuid import uuid4
import os
from flask import Flask, render_template, redirect, url_for, request, flash, session
from csueb.forms import LoginForm, PostForm, RegisterForm, CommentForm
from csueb.db import get_db

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from werkzeug.security import check_password_hash, generate_password_hash
from csueb.db import get_db

# TODO
# 1. Delete posts
# 2. Update profile
# 3. Add images to comments/posts

bp = Blueprint('link', __name__, url_prefix='/link')

@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT * FROM user WHERE id = ?', (user_id,)
        ).fetchone()

def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('link.login'))

        return view(**kwargs)

    return wrapped_view

@bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        error = None
        user = db.execute(
            "SELECT * FROM user WHERE username = ?", (username,)
        ).fetchone()


        if user is None:
            error = "Incorrect credentials."
        if user is not None and not check_password_hash(user['password'],password):
            error = "Incorrect credentials."
        if error is None:
            session.clear()
            session['user_id'] = user['id']
            return redirect(url_for('home'))
        flash(error)
    return render_template("login.html", form=form)

@bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        db = get_db()
        error = None
        username = form.username.data
        password = form.password.data
        email = form.email.data
        firstname = form.firstname.data
        lastname = form.lastname.data
        uuid = uuid4()

        if error is None:
            try:
                db.execute(
                    "INSERT INTO user (username, password, email, firstname, lastname, uuid) VALUES (?, ?, ?, ?, ?, ?)",
                    (username, generate_password_hash(password), email, firstname, lastname, str(uuid)),
                )
                db.commit()
            except db.IntegrityError:
                print(db.IntegrityError)
                error = f"User {username} is already registered."
            else:
                return redirect(url_for("link.login"))
        flash(error)
    return render_template("register.html", form=form)

@bp.route('/logout')
@login_required
def logout():
    session.clear()
    return redirect(url_for('home'))

@bp.route('/profile/<uuid>')
@login_required
def getprofile(uuid):
    db = get_db()
    user = db.execute(
        "SELECT * FROM user WHERE uuid = ?", (uuid,)
    ).fetchone()
    posts = db.execute(
        "SELECT * FROM post WHERE author_uuid = ?", (uuid,)
    )
    return render_template('profile.html', user=user, posts=posts)

@bp.route('/posts')
@login_required
def getposts():
    db = get_db()
    posts = db.execute(
        "SELECT * FROM user INNER JOIN post ON uuid=author_uuid ORDER BY created DESC"
    ).fetchall()
    return render_template('posts.html', posts=posts)

@bp.route('/posts/<category>')
@login_required
def sortByCategory(category):
    db = get_db()
    posts = db.execute(
        "SELECT * FROM user as u INNER JOIN post AS p ON u.uuid = p.author_uuid WHERE p.category = ? ORDER BY p.created DESC", (category,)
    ).fetchall()
    return render_template('posts.html', posts=posts, category=category)

@bp.route('/post/<post_uuid>', methods=['GET', 'POST'])
@login_required
def post(post_uuid):
    form = CommentForm()
    db = get_db()
    post = db.execute(
        "SELECT * FROM user INNER JOIN post ON uuid=author_uuid WHERE post_uuid = ?", (post_uuid,)
    ).fetchone()
    comments = db.execute(
        "SELECT * from user INNER JOIN comment ON uuid=author_uuid WHERE parent_uuid = ?", (post_uuid,)
    ).fetchall()

    if request.method == 'POST':
        if form.validate_on_submit():
            body = form.body.data
            error = None
            if error is not None:
                flash(error)
            else:
                db = get_db()
                parent_uuid = post["post_uuid"]
                author_uuid = g.user['uuid']
                created = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                db.execute("INSERT INTO comment (author_uuid, parent_uuid, body, created) "
                           "VALUES (?, ?, ?, ?)",
                           (author_uuid, str(parent_uuid), body, str(created)))
                db.commit()
                return redirect(url_for("link.post", post_uuid=post['post_uuid']))

    return render_template('post.html', post=post, form=form, comments=comments)

@bp.route('/submit', methods=['GET', 'POST'])
@login_required
def submit():
    form = PostForm()
    if request.method == 'POST':
        if form.validate_on_submit():
            title = form.title.data
            body = form.body.data
            category = form.category.data
            error = None
            if error is not None:
                flash(error)
            else:
                db = get_db()
                post_uuid = uuid4()
                author_uuid = g.user['uuid']
                created = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                db.execute("INSERT INTO post (author_uuid, post_uuid, title, body, created, category) "
                           "VALUES (?, ?, ?, ?, ?, ?)",
                           (author_uuid, str(post_uuid), title, body, str(created), category))
                db.commit()
                return redirect(url_for("link.getposts"))
    return render_template('submit.html', form=form)
