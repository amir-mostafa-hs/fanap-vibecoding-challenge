"""Category classification: LLM when configured, keyword rules otherwise."""
from __future__ import annotations

import pandas as pd

from .config import Settings
from .llm import LLMClient, MessageToClassify

KEYWORDS: dict[str, tuple[str, ...]] = {
    "refund": (
        "refund", "money back", "bargasht", "pas bedid",
        "مرجوع", "بازگشت وجه", "برگشت پول", "پول برنگشته", "استرداد", "عودت",
    ),
    "payment": (
        "payment", "paid", "charged", "card", "wallet", "invoice", "factor", "pardakht",
        "پرداخت", "برداشت", "کارت", "کیف پول", "فاکتور", "تراکنش", "درگاه",
    ),
    "delivery": (
        "delivery", "deliver", "arrive", "arrived", "shipping", "courier", "tracking", "package", "parcel",
        "tahvil", "ersal", "post",
        "ارسال", "تحویل", "مرسوله", "پیک", "بسته", "پست", "کد رهگیری",
    ),
    "product_quality": (
        "broken", "damaged", "defective", "quality", "fake", "not working", "wrong item",
        "different item", "manual", "install", "colour", "color", "kharab", "rang", "taviz",
        "خراب", "شکسته", "کیفیت", "معیوب", "تقلبی", "کار نمی", "رنگ", "لک", "راهنما",
        "نصب", "مشخصات", "تعویض", "بو ",
    ),
    "account": (
        "account", "password", "login", "log in", "sign in", "otp", "hesab", "ramz",
        "حساب", "رمز", "ورود", "پسورد", "کد تایید", "شماره موبایل",
    ),
}

CATEGORY_ORDER: tuple[str, ...] = ("refund", "payment", "account", "product_quality", "delivery")


def classify_keywords(subject: str, body: str) -> str:
    text = f"{subject} {body}".lower()
    for category in CATEGORY_ORDER:
        if any(word in text for word in KEYWORDS[category]):
            return category
    return "other"


def classify_messages(df: pd.DataFrame, settings: Settings) -> pd.Series:
    """Return a category per row of ``df``."""
    if not settings.llm_base_url:
        return pd.Series(
            [classify_keywords(s, b) for s, b in zip(df["subject"], df["body"])],
            index=df.index,
            dtype=object,
        )

    try:
        client = LLMClient(settings)
        batch = [
            MessageToClassify(message_id=m, subject=s, body=b)
            for m, s, b in zip(df["message_id"], df["subject"], df["body"])
        ]
        results = client.classify(batch)
    except Exception:
        results = {}

    categories = []
    for msg_id, subject, body in zip(df["message_id"], df["subject"], df["body"]):
        if msg_id in results:
            categories.append(results[msg_id].category)
        else:
            categories.append(classify_keywords(subject, body))

    return pd.Series(categories, index=df.index, dtype=object)
