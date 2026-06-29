"""Saved words persistence endpoints backed by Firebase Admin (Firestore)."""
from uuid import uuid4

from flask import Blueprint, g, jsonify, request
from firebase_admin import firestore

from utils.firebase_auth import require_firebase_auth

saved_words_bp = Blueprint("saved_words", __name__)


def _saved_words_collection(user_id: str):
    db = firestore.client()
    return db.collection("users").document(user_id).collection("saved-words")


@saved_words_bp.route("/saved-words", methods=["GET"])
@require_firebase_auth
def list_saved_words():
    user_id = g.firebase_user.get("uid")
    docs = (
        _saved_words_collection(user_id)
        .order_by("savedAt", direction=firestore.Query.DESCENDING)
        .stream()
    )
    words = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        data["savedAt"] = _serialize_timestamp(data.get("savedAt"))
        words.append(data)
    return jsonify({"words": words})


@saved_words_bp.route("/saved-words", methods=["POST"])
@require_firebase_auth
def save_word():
    user_id = g.firebase_user.get("uid")
    data = request.get_json(silent=True) or {}

    word_id = str(uuid4())
    doc_data = {
        "word": data.get("word", ""),
        "definition": data.get("definition", ""),
        "partOfSpeech": data.get("partOfSpeech", ""),
        "exampleSentence": data.get("exampleSentence", ""),
        "contextSentence": data.get("contextSentence", ""),
        "syllables": data.get("syllables", []),
        "illustration": data.get("illustration"),
        "audio": data.get("audio"),
        "notes": data.get("notes", ""),
        "savedAt": firestore.SERVER_TIMESTAMP,
    }

    _saved_words_collection(user_id).document(word_id).set(doc_data)
    return jsonify({"id": word_id, **{k: v for k, v in doc_data.items() if k != "savedAt"}, "savedAt": None})


@saved_words_bp.route("/saved-words/<word_id>", methods=["DELETE"])
@require_firebase_auth
def delete_saved_word(word_id):
    user_id = g.firebase_user.get("uid")
    doc_ref = _saved_words_collection(user_id).document(word_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    doc_ref.delete()
    return jsonify({"deleted": True})


@saved_words_bp.route("/saved-words/<word_id>", methods=["PUT"])
@require_firebase_auth
def update_saved_word(word_id):
    user_id = g.firebase_user.get("uid")
    data = request.get_json(silent=True) or {}

    doc_ref = _saved_words_collection(user_id).document(word_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404

    updates = {}
    if "definition" in data:
        updates["definition"] = data["definition"]
    if "notes" in data:
        updates["notes"] = data["notes"]

    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    doc_ref.update(updates)
    return jsonify({"updated": True})


def _serialize_timestamp(value):
    if value is None:
        return None
    if hasattr(value, "timestamp"):
        return int(value.timestamp() * 1000)
    if hasattr(value, "seconds"):
        return int(value.seconds * 1000)
    return value
